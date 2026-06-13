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
import { EstimateBookingDto } from './dto/estimate-booking.dto';
import { JwtService } from '@nestjs/jwt';
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
    private jwt: JwtService,
  ) {}

  // ── حساب تفاصيل التسعير المشترك ──
  private async calculatePricingDetails(car: any, dto: { startDate: string; endDate: string; deliveryType: 'HOME' | 'PICKUP'; withDriver: boolean; couponCode?: string }) {
    const settings = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    const driverOptionEnabled = settingsMap.get('driver_option_enabled') === 'true';
    const driverFeePerDay = parseFloat(settingsMap.get('driver_fee_per_day') || '150');
    const deliveryHomeFee = parseFloat(settingsMap.get('delivery_home_fee') || '200');
    const commissionRateShortTerm = parseFloat(settingsMap.get('commission_rate_short_term') || '0.05');
    const commissionRateLongTerm = parseFloat(settingsMap.get('commission_rate_long_term') || '0.03');

    // التحقق من إتاحة خيار السائق
    if ((dto.withDriver || car.driverRequired) && !driverOptionEnabled) {
      throw new BadRequestException('خيار السائق غير متاح حالياً من قبل الإدارة');
    }

    // لو العربية بتخرج بسواق فقط → withDriver لازم يكون true
    if (car.driverRequired && !dto.withDriver) {
      throw new BadRequestException('هذه السيارة لا تُأجَّر إلا بسواق');
    }

    const totalDays = this.calcDays(dto.startDate, dto.endDate);
    
    // حساب سعر اليوم بناءً على مدة الحجز (متدرج)
    let dailyPrice = car.pricePerDay;
    if (totalDays >= 30) {
      dailyPrice = car.pricePerMonth ?? car.pricePerWeek ?? car.pricePerDay;
    } else if (totalDays >= 7) {
      dailyPrice = car.pricePerWeek ?? car.pricePerDay;
    }
    
    const subtotal = dailyPrice * totalDays;

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

    // كوبون
    let discountAmount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const couponResult = await this.coupons.validate(dto.couponCode, subtotal);
      discountAmount = couponResult.discountAmount;
      couponId = couponResult.couponId;
    }

    const totalAmount = subtotal + deliveryFee + driverFee + insuranceFee - discountAmount;
    
    // حساب نسبة عمولة المنصة بناءً على مدة الحجز (مسترجعة ديناميكياً من إعدادات النظام)
    const commissionRate = totalDays >= 30 ? commissionRateLongTerm : commissionRateShortTerm;
    const commission = subtotal * commissionRate;
    const ownerPayout = subtotal - commission + deliveryFee + driverFee;

    return {
      totalDays,
      dailyPrice,
      subtotal,
      deliveryFee,
      driverFee,
      insuranceFee,
      discountAmount,
      couponId,
      totalAmount,
      commission,
      ownerPayout,
    };
  }

  // ── حساب التسعير التقديري (دون حفظ حجز) ──
  async estimatePrice(userId: string, dto: EstimateBookingDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start < new Date()) throw new BadRequestException('تاريخ البداية لا يمكن أن يكون في الماضي');
    if (end <= start) throw new BadRequestException('تاريخ النهاية لازم يكون بعد تاريخ البداية');

    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      include: { owner: true },
    });
    if (!car || !car.isApproved) throw new NotFoundException('Car not found');

    const pricing = await this.calculatePricingDetails(car, dto);

    // تفعيل / تجديد قفل التشيك أوت مؤقتاً لمدة 10 دقائق
    await this.redis.getClient().set(`checkout-lock:${dto.carId}`, userId, 'EX', 600);

    return {
      totalDays: pricing.totalDays,
      dailyPrice: pricing.dailyPrice,
      pricing: {
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        driverFee: pricing.driverFee,
        insuranceFee: pricing.insuranceFee,
        discountAmount: pricing.discountAmount,
        totalAmount: pricing.totalAmount,
      },
    };
  }

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

    // ✔️ فحص بلوكات الحظر اليدوية للسيارة - مقارنة حصرية
    const blockConflict = await this.prisma.carAvailabilityBlock.findFirst({
      where: {
        carId: dto.carId,
        AND: [
          { startDate: { lt: end } },
          { endDate:   { gt: start } },
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

    // 4. لو HOME → لازم يحدد الموقع
    if (dto.deliveryType === 'HOME' && (!dto.deliveryLat || !dto.deliveryLng)) {
      throw new BadRequestException('لازم تحدد موقعك على الخريطة');
    }

    // 5. تحقق من إتاحة التواريخ
    await this.checkAvailability(dto.carId, dto.startDate, dto.endDate);

    // 6. حساب التسعير
    const pricing = await this.calculatePricingDetails(car, dto);

    // 7. Booking Code — CR-YYMMDD-XXXX
    const bookingCode = this.generateBookingCode();

    // 8. أنشئ الحجز بحالة مؤكدة مباشرة (الدفع عند الاستلام)
    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        carId: dto.carId,
        userId,
        startDate: start,
        endDate: end,
        totalDays: pricing.totalDays,
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        driverFee: pricing.driverFee,
        insuranceFee: pricing.insuranceFee,
        deposit: 0,
        discountAmount: pricing.discountAmount,
        platformCommission: pricing.commission,
        ownerPayout: pricing.ownerPayout,
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
        couponId: pricing.couponId,
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        payment: {
          create: {
            method: 'CASH',
            amount: pricing.totalAmount,
            status: 'PENDING',
          }
        }
      },
      include: { 
        car: { include: { owner: true } },
        user: true,
      },
    });

    // 9. لو استخدم كوبون → زيد الـ usedCount
    if (pricing.couponId) await this.coupons.incrementUsage(pricing.couponId);

    // فك قفل التشيك أوت فوراً بعد إتمام الحجز بنجاح
    await this.redis.getClient().del(`checkout-lock:${dto.carId}`);

    // 10. إرسال إشعارات فورية للعميل وصاحب المعرض بتأكيد الحجز
    const isPickup = booking.deliveryType === DeliveryType.PICKUP;
    await this.notifications.send(booking.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'تم تأكيد حجزك! 🎉',
      body: isPickup
        ? `كود الاستلام: ${booking.bookingCode} — اتوجه لـ ${booking.car.owner.branchAddress || 'المعرض'}`
        : `تم تأكيد حجزك لـ ${booking.car.make} ${booking.car.model} — العربية جاية على عنوانك`,
      data: { bookingId: booking.id, bookingCode: booking.bookingCode },
    });

    await this.notifications.send(booking.car.owner.userId, {
      type: 'NEW_BOOKING',
      title: '🚗 حجز جديد (الدفع عند الاستلام)',
      body: `${booking.user.name || 'عميل'} حجز ${booking.car.make} ${booking.car.model}${booking.withDriver ? ' (مع سواق)' : ''}`,
      data: { bookingId: booking.id, bookingCode: booking.bookingCode },
    });

    return {
      ...booking,
      totalAmount: pricing.totalAmount,
      pricing: {
        subtotal: pricing.subtotal,
        deliveryFee: pricing.deliveryFee,
        driverFee: pricing.driverFee,
        insuranceFee: pricing.insuranceFee,
        discountAmount: pricing.discountAmount,
        totalAmount: pricing.totalAmount,
      },
    };
  }

  // ── تحديث حالة الحجز من الـ Admin (مثال: شحن السيارة) ──
  async updateBookingStatusAdmin(bookingId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true, user: true },
    });

    if (!booking) throw new NotFoundException('الحجز غير موجود');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    if (status === 'IN_DELIVERY') {
      await this.notifications.send(booking.userId, {
        type: 'BOOKING_IN_DELIVERY',
        title: 'السيارة في الطريق إليك! 🚗',
        body: `بدأ السائق رحلة تسليم سيارتك ${booking.car.make} ${booking.car.model}.`,
        data: { bookingId: booking.id },
      });
    }

    return updated;
  }

  // ── توليد توكن تسليم مشفر للـ QR Code ──
  async generateHandoverToken(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException('الحجز غير موجود');
    if (booking.status !== 'IN_DELIVERY' && booking.status !== 'CONFIRMED') {
      throw new BadRequestException('لا يمكن توليد رمز تسليم لحجز غير مؤكد أو غير مشحون');
    }

    const token = this.jwt.sign(
      {
        bookingId: booking.id,
        action: 'HANDOVER_PICKUP',
      },
      {
        expiresIn: '1d', // صالح لمدة يوم
      },
    );

    return { token };
  }

  // ── التحقق من توكن التسليم ومسح الـ QR للعميل ──
  async verifyHandover(userId: string, bookingId: string, token: string) {
    let decoded: any;
    try {
      decoded = this.jwt.verify(token);
    } catch (err) {
      throw new BadRequestException('رمز الـ QR غير صالح أو منتهي الصلاحية');
    }

    if (decoded.bookingId !== bookingId || decoded.action !== 'HANDOVER_PICKUP') {
      throw new BadRequestException('رمز الـ QR لا يخص عملية التسليم لهذا الحجز');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } } },
    });

    if (!booking) throw new NotFoundException('الحجز غير موجود');
    
    if (booking.userId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لإجراء عملية التسليم لهذا الحجز');
    }

    const validStatuses: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.IN_DELIVERY,
    ];
    if (!validStatuses.includes(booking.status)) {
      throw new BadRequestException('الحجز ليس في حالة تسمح بالتسليم (يجب أن يكون CONFIRMED أو IN_DELIVERY)');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ACTIVE },
      });

      await tx.car.update({
        where: { id: booking.carId },
        data: { status: 'RENTED' },
      });

      await tx.handover.create({
        data: {
          bookingId: bookingId,
          type: 'PICKUP',
          notes: 'تم تسليم السيارة للعميل بنجاح بعد مسح رمز الـ QR وتأكيده عبر الهاتف',
        },
      });
    });

    await this.notifications.send(booking.userId, {
      type: 'CAR_HANDOVER_COMPLETED',
      title: 'تم استلام السيارة بنجاح 🚗',
      body: `نتمنى لك رحلة سعيدة وآمنة مع سيارتك ${booking.car.make} ${booking.car.model}.`,
      data: { bookingId: booking.id },
    });

    await this.notifications.send(booking.car.owner.userId, {
      type: 'CAR_HANDOVER_COMPLETED_OWNER',
      title: 'بدء فترة إيجار سيارتك 🔑',
      body: `العميل استلم سيارتك ${booking.car.make} ${booking.car.model} وبدأت فترة الإيجار الآن.`,
      data: { bookingId: booking.id },
    });

    return {
      success: true,
      message: 'Car handover verified and completed successfully.',
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
          { startDate: { lt: new Date(endDate) } },
          { endDate: { gt: new Date(startDate) } },
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
