import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import Redis from 'ioredis';

@Injectable()
export class BookingsService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  // ── إنشاء حجز جديد ──
  async create(userId: string, dto: CreateBookingDto) {
    // 1. تحقق إن العربية موجودة
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException('Car not found');

    // 2. تحقق من availability
    await this.checkAvailability(dto.carId, dto.startDate, dto.endDate);

    // 3. Lock الـ slot في Redis لمدة 10 دقايق
    const lockKey = `slot:${dto.carId}:${dto.startDate}:${dto.endDate}`;
    const locked = await this.redis.set(lockKey, userId, 'EX', 600, 'NX');
    if (!locked) throw new ConflictException('Car just got booked, try another date');

    // 4. احسب الفلوس
    const totalDays = this.calcDays(dto.startDate, dto.endDate);
    const subtotal = car.pricePerDay * totalDays;
    const commission = subtotal * car.owner.commissionRate;
    const ownerPayout = subtotal - commission + dto.deliveryFee;

    // 5. أنشئ الحجز
    const booking = await this.prisma.booking.create({
      data: {
        carId: dto.carId,
        userId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
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

  // ── Owner يقبل أو يرفض ──
  async respondToBooking(
    ownerId: string,
    bookingId: string,
    action: 'accept' | 'reject',
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: { include: { owner: true } }, user: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.car.owner.userId !== ownerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.PENDING_OWNER_APPROVAL) {
      throw new ConflictException('Booking is not pending approval');
    }

    if (action === 'accept') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED, confirmedAt: new Date() },
      });

      await this.notifications.send(booking.userId, {
        type: 'BOOKING_CONFIRMED',
        title: 'تم تأكيد حجزك',
        body: `حجزك لـ ${booking.car.make} ${booking.car.model} تم تأكيده`,
        data: { bookingId },
      });
    } else {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED, cancellationReason: reason },
      });

      // ابدأ عملية الـ refund
      await this.notifications.send(booking.userId, {
        type: 'BOOKING_REJECTED',
        title: 'تم رفض الحجز',
        body: `للأسف تم رفض حجزك. سيتم استرداد المبلغ خلال 3-5 أيام عمل`,
        data: { bookingId },
      });
    }

    return { success: true };
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

  // ── اجيب طلبات الـ owner ──
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

    if (conflict) throw new ConflictException('Car not available for these dates');
  }

  private calcDays(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
