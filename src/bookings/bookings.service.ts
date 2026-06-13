import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../common/redis.service';
import { CouponsService } from '../coupons/coupons.service';
import { BookingStatus, DeliveryType, InsuranceType } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { randomBytes } from 'crypto';

const SLOT_LOCK_TTL = 600;      // 10 دقايق
const COOLDOWN_TTL = 60 * 60 * 3; // 3 ساعات

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private redis: RedisService,
    private coupons: CouponsService,
    private config: ConfigService,
  ) {}

  // ── إنشاء حجز جديد ──
  async create(userId: string, dto: CreateBookingDto) {
    // 1. Validation التواريخ
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start < new Date()) throw new BadRequestException('تاريخ البداية لا يمكن أن يكون في الماضي');
    if (end <= start) throw new BadRequestException('تاريخ النهاية لازم يكون بعد تاريخ البداية');

    // 2. جيب العربية
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      include: { owner: true },
    });
    if (!car || !car.isApproved) throw new NotFoundException('Car not found');

    // التحقق من تواريخ إتاحة السيارة المحددة من المعرض
    if (car.availableFrom && start < car.availableFrom) {
      throw new BadRequestException({
        ar: `السيارة غير متاحة للحجز قبل تاريخ ${car.availableFrom.toISOString().split('T')[0]}`,
        en: `Car is not available before ${car.availableFrom.toISOString().split('T')[0]}`,
      });
    }
    if (car.availableTo && end > car.availableTo) {
      throw new BadRequestException({
        ar: `السيارة غير متاحة للحجز بعد تاريخ ${car.availableTo.toISOString().split('T')[0]}`,
        en: `Car is not available after ${car.availableTo.toISOString().split('T')[0]}`,
      });
    }

    // ✔️ فحص وضع إجازة المعرض (Snooze)
    if (car.owner.snoozeUntil && car.owner.snoozeUntil > new Date()) {
      throw new BadRequestException({
        ar: `المعرض غير متاح حالياً (وضع الإجازة) حتى ${car.owner.snoozeUntil.toISOString().split('T')[0]}`,
        en: `Showroom is currently unavailable (on break) until ${car.owner.snoozeUntil.toISOString().split('T')[0]}`,
      });
    }

    // ✔️ فحص بلوكات الحظر اليدوية للسيارة
    const blockConflict = await this.prisma.carAvailabilityBlock.findFirst({
      where: {
        carId: dto.carId,
        AND: [
          { startDate: { lte: end } },
          { endDate:   { gte: start } },
        ],
      },
    });
    if (blockConflict) {
      throw new BadRequestException({
        ar: `السيارة محجوزة / غير متاحة في هذه الفترة${blockConflict.reason ? ` (السبب: ${blockConflict.reason})` : ''}`,
        en: `Car is blocked / unavailable during this period${blockConflict.reason ? ` (Reason: ${blockConflict.reason})` : ''}`,
      });
    }

    // 3. منع الـ owner من حجز سيارته
    if (car.owner.userId === userId) throw new BadRequestException('لا يمكنك حجز سيارتك الخاصة');

    // جلب إعدادات النظام من قاعدة البيانات
    const settings = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const driverOptionEnabled = settingsMap.get('driver_option_enabled') === 'true';
    const driverFeePerDay = parseFloat(settingsMap.get('driver_fee_per_day') || '150');
    const deliveryHomeFee = parseFloat(settingsMap.get('delivery_home_fee') || '200');

    // 4. التحقق من إتاحة خيار السائق
    if ((dto.withDriver || car.driverRequired) && !driverOptionEnabled) {
      throw new BadRequestException('خيار السائق غير متاح حالياً من قبل الإدارة');
    }

    // 5. لو العربية بتخرج بسواق فقط → withDriver لازم يكون true
    if (car.driverRequired && !dto.withDriver) {
      throw new BadRequestException('هذه السيارة لا تُأجَّر إلا بسواق');
    }

    // 6. لو HOME → لازم يحدد الموقع
    if (dto.deliveryType === 'HOME' && (!dto.deliveryLat || !dto.deliveryLng)) {
      throw new BadRequestException('لازم تحدد موقعك على الخريطة');
    }

    // 6. تحقق من availability
    await this.checkAvailability(dto.carId, dto.startDate, dto.endDate);

    // 7. Slot Lock
    const lockKey = `slot:${dto.carId}:${dto.startDate}:${dto.endDate}`;
    const locked = await this.redis.getClient().set(lockKey, userId, 'EX', SLOT_LOCK_TTL, 'NX');
    if (!locked) throw new ConflictException('السيارة بتتحجز دلوقتي، جرب تواريخ تانية');

    // 8. احسب الفلوس
    const totalDays = this.calcDays(dto.startDate, dto.endDate);
    const subtotal = car.pricePerDay * totalDays;

    // رسوم التوصيل
    const deliveryFee = dto.deliveryType === 'HOME'
      ? deliveryHomeFee
      : 0;

    // رسوم السواق
    const driverFee = dto.withDriver
      ? driverFeePerDay * totalDays
      : 0;

    // رسوم التأمين (تأمين أساسي مجاني دائماً)
    const insuranceFee = 0;

    // 9. كوبون
    let discountAmount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const couponResult = await this.coupons.validate(dto.couponCode, subtotal);
      discountAmount = couponResult.discountAmount;
      couponId = couponResult.couponId;
    }

    // 10. الإجمالي النهائي
    const totalAmount = subtotal + deliveryFee + driverFee + insuranceFee - discountAmount;
    const commission = subtotal * car.owner.commissionRate;
    const ownerPayout = subtotal - commission + deliveryFee + driverFee;

    // 11. Booking Code — CR-YYMMDD-XXXX
    const bookingCode = this.generateBookingCode();

    // 12. أنشئ الحجز
    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        carId: dto.carId,
        userId,
        startDate: start,
        endDate: end,
        totalDays,
        subtotal,
        deliveryFee,
        driverFee,
        insuranceFee,
        deposit: car.depositAmount,
        discountAmount,
        platformCommission: commission,
        ownerPayout,
        deliveryType: dto.deliveryType as DeliveryType,
        deliveryAddress: dto.deliveryAddress,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        withDriver: dto.withDriver,
        additionalDriver: dto.additionalDriver,
        insuranceType: (dto.insuranceType || 'BASIC') as InsuranceType,
        nationalIdFrontUrl: dto.nationalIdFrontUrl,
        nationalIdBackUrl: dto.nationalIdBackUrl,
        driverLicenseUrl: dto.driverLicenseUrl,
        specialRequests: dto.specialRequests,
        couponId,
        status: BookingStatus.PENDING_PAYMENT,
      },
      include: { car: { include: { owner: true } } },
    });

    // 13. لو استخدم كوبون → زيد الـ usedCount
    if (couponId) await this.coupons.incrementUsage(couponId);

    return {
      ...booking,
      totalAmount,
      pricing: { subtotal, deliveryFee, driverFee, insuranceFee, discountAmount, totalAmount },
    };
  }

  // ── تأكيد فوري بعد الدفع (Instant Confirm) ──
  async confirmAfterPayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } }, user: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new ConflictException('الحجز مش في حالة انتظار دفع');
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED, confirmedAt: new Date() },
    });

    // إشعار العميل حسب نوع التوصيل
    const isPickup = booking.deliveryType === DeliveryType.PICKUP;
    await this.notifications.send(booking.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'تم تأكيد حجزك! 🎉',
      body: isPickup
        ? `كود الاستلام: ${booking.bookingCode} — اتوجه لـ ${booking.car.owner.branchAddress || 'المعرض'}`
        : `تم تأكيد حجزك لـ ${booking.car.make} ${booking.car.model} — العربية جاية على عنوانك`,
      data: { bookingId, bookingCode: booking.bookingCode },
    });

    // إشعار الـ owner
    await this.notifications.send(booking.car.owner.userId, {
      type: 'NEW_BOOKING',
      title: '🚗 حجز جديد',
      body: `${booking.user.name || 'عميل'} حجز ${booking.car.make} ${booking.car.model}${booking.withDriver ? ' (مع سواق)' : ''}`,
      data: { bookingId, bookingCode: booking.bookingCode },
    });

    return { success: true };
  }

  // ── إلغاء + Car Cooldown 3 ساعات ──
  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } } },
    });

    if (!booking) throw new NotFoundException('الحجز مش موجود');

    const isCustomer = booking.userId === userId;
    const isOwner = booking.car.owner.userId === userId;
    if (!isCustomer && !isOwner) throw new ForbiddenException();

    const cancellableStatuses: BookingStatus[] = [
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(booking.status)) {
      throw new ConflictException('لا يمكن إلغاء الحجز في هذه المرحلة');
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancellationReason: reason || 'تم الإلغاء' },
    });

    // Car Cooldown — إخفاء السيارة من البحث 3 ساعات
    await this.redis.getClient().set(`cooldown:${booking.carId}`, '1', 'EX', COOLDOWN_TTL);

    if (isCustomer) {
      await this.notifications.send(booking.car.owner.userId, {
        type: 'BOOKING_CANCELLED_BY_CUSTOMER',
        title: 'تم إلغاء الحجز',
        body: `العميل ألغى حجز ${booking.car.make} ${booking.car.model}`,
        data: { bookingId },
      });
    } else {
      await this.notifications.send(booking.userId, {
        type: 'BOOKING_CANCELLED_BY_OWNER',
        title: 'تم إلغاء حجزك',
        body: 'للأسف تم إلغاء حجزك. سيتم استرداد المبلغ خلال 3-5 أيام عمل',
        data: { bookingId },
      });
    }

    return { success: true, message: 'تم إلغاء الحجز بنجاح' };
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        car: { select: { make: true, model: true, imageUrls: true } },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOwnerBookings(ownerId: string, status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: {
        car: { owner: { userId: ownerId } },
        ...(status && { status }),
      },
      include: {
        user: { select: { name: true, phone: true, avatarUrl: true } },
        car: { select: { make: true, model: true, licensePlate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async checkAvailability(carId: string, startDate: string, endDate: string) {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        carId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.IN_DELIVERY] },
        AND: [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
    });
    if (conflict) throw new ConflictException('السيارة مش متاحة في هذه التواريخ');
  }

  // ── CR-240612-A7X3 ──
  private generateBookingCode(): string {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return `CR-${yy}${mm}${dd}-${suffix}`;
  }

  private calcDays(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
