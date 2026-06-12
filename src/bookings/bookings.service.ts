import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../common/redis.service';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';

// مدة الـ Slot Lock: 10 دقايق (بيمنع double booking أثناء الدفع)
const SLOT_LOCK_TTL = 600;

// مدة الـ Car Cooldown بعد الإلغاء: 3 ساعات
const COOLDOWN_TTL = 60 * 60 * 3; // 10800 ثانية

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private redis: RedisService,
  ) {}

  // ── إنشاء حجز جديد ──
  async create(userId: string, dto: CreateBookingDto) {
    // 1. validation على التواريخ
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start < new Date()) {
      throw new BadRequestException('تاريخ البداية لا يمكن أن يكون في الماضي');
    }
    if (end <= start) {
      throw new BadRequestException('تاريخ النهاية لازم يكون بعد تاريخ البداية');
    }

    // 2. تحقق إن العربية موجودة
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException('Car not found');

    // 3. منع الـ owner من حجز سيارته الخاصة
    if (car.owner.userId === userId) {
      throw new BadRequestException('لا يمكنك حجز سيارتك الخاصة');
    }

    // 4. تحقق من availability في DB
    await this.checkAvailability(dto.carId, dto.startDate, dto.endDate);

    // 5. ── Slot Lock في Redis (EX 600 NX) ──
    // بيمنع أكتر من عميل يحجز نفس العربية بنفس التواريخ في نفس الوقت
    const lockKey = `slot:${dto.carId}:${dto.startDate}:${dto.endDate}`;
    const locked = await this.redis.getClient().set(lockKey, userId, 'EX', SLOT_LOCK_TTL, 'NX');
    if (!locked) {
      throw new ConflictException('السيارة بتتحجز دلوقتي، جرب تواريخ تانية');
    }

    // 6. احسب الفلوس
    const totalDays = this.calcDays(dto.startDate, dto.endDate);
    const subtotal = car.pricePerDay * totalDays;
    const commission = subtotal * car.owner.commissionRate;
    const ownerPayout = subtotal - commission + (dto.deliveryFee || 0);

    // 7. أنشئ الحجز — بيبدأ بـ PENDING_PAYMENT لحد ما الدفع ينجح
    const booking = await this.prisma.booking.create({
      data: {
        carId: dto.carId,
        userId,
        startDate: start,
        endDate: end,
        totalDays,
        subtotal,
        deliveryFee: dto.deliveryFee || 0,
        deposit: car.depositAmount,
        platformCommission: commission,
        ownerPayout,
        deliveryAddress: dto.deliveryAddress,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        status: BookingStatus.PENDING_PAYMENT,
      },
    });

    return booking;
  }

  // ── تأكيد الحجز فوراً بعد الدفع (Instant Confirm) ──
  // يُستدعى من Payment Webhook لما الدفع ينجح
  async confirmAfterPayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } }, user: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new ConflictException('الحجز مش في حالة انتظار دفع');
    }

    // تأكيد فوري — بدون موافقة owner
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    // إبلاغ العميل
    await this.notifications.send(booking.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'تم تأكيد حجزك! 🎉',
      body: `حجزك لـ ${booking.car.make} ${booking.car.model} تم تأكيده بنجاح`,
      data: { bookingId },
    });

    // إبلاغ الـ owner (للعلم بس — مش محتاج يوافق)
    await this.notifications.send(booking.car.owner.userId, {
      type: 'NEW_BOOKING',
      title: 'حجز جديد على سيارتك',
      body: `${booking.user.name || 'عميل'} حجز ${booking.car.make} ${booking.car.model} من ${booking.startDate.toLocaleDateString('ar-EG')} لـ ${booking.endDate.toLocaleDateString('ar-EG')}`,
      data: { bookingId },
    });

    return { success: true };
  }

  // ── إلغاء حجز + Car Cooldown ──
  async cancelBooking(
    userId: string,
    bookingId: string,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } } },
    });

    if (!booking) throw new NotFoundException('الحجز مش موجود');

    // التحقق من الصلاحية: العميل أو الـ owner بس اللي يقدر يلغي
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

    // تحديث الحجز
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason || 'تم الإلغاء',
      },
    });

    // ── Car Cooldown: إخفاء السيارة من البحث لمدة 3 ساعات ──
    // بيمنع حجز فوري للسيارة بعد الإلغاء لحد ما الـ owner يتأكد من حالتها
    const cooldownKey = `cooldown:${booking.carId}`;
    await this.redis.getClient().set(cooldownKey, '1', 'EX', COOLDOWN_TTL);

    // إبلاغ الطرف الآخر بالإلغاء
    if (isCustomer) {
      // العميل ألغى → أبلغ الـ owner
      await this.notifications.send(booking.car.owner.userId, {
        type: 'BOOKING_CANCELLED_BY_CUSTOMER',
        title: 'تم إلغاء الحجز',
        body: `العميل ألغى حجز ${booking.car.make} ${booking.car.model}`,
        data: { bookingId },
      });
    } else {
      // الـ owner ألغى → أبلغ العميل
      await this.notifications.send(booking.userId, {
        type: 'BOOKING_CANCELLED_BY_OWNER',
        title: 'تم إلغاء حجزك',
        body: `للأسف تم إلغاء حجزك. سيتم استرداد المبلغ خلال 3-5 أيام عمل`,
        data: { bookingId },
      });
    }

    return { success: true, message: 'تم إلغاء الحجز بنجاح' };
  }

  // ── اجيب حجوزات العميل ──
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

  // ── اجيب حجوزات المعرض ──
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

  // ── تحقق من عدم وجود تعارض في التواريخ ──
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

  private calcDays(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
