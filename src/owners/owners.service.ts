import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { BookingStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OwnersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // تسجيل معرض جديد
  async register(userId: string, dto: RegisterOwnerDto) {
    const existing = await this.prisma.owner.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Already registered as owner');

    return this.prisma.owner.create({
      data: {
        userId,
        businessName: dto.businessName,
        commercialReg: dto.commercialReg,
        address: dto.address,
      },
    });
  }

  async getProfile(userId: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        cars: { select: { id: true, make: true, model: true, status: true } },
      },
    });
    if (!owner) throw new NotFoundException('Owner profile not found');
    return owner;
  }

  // Dashboard stats للـ owner
  async getDashboardStats(userId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) throw new NotFoundException('Owner not found');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCars,
      availableCars,
      pendingBookings,
      activeBookings,
      monthlyBookings,
      monthlyRevenue,
      totalRevenue,
      avgRating,
    ] = await Promise.all([
      // عدد السيارات الكلي
      this.prisma.car.count({ where: { ownerId: owner.id } }),

      // السيارات المتاحة
      this.prisma.car.count({ where: { ownerId: owner.id, status: 'AVAILABLE' } }),

      // طلبات في الانتظار
      this.prisma.booking.count({
        where: {
          car: { ownerId: owner.id },
          status: BookingStatus.PENDING_OWNER_APPROVAL,
        },
      }),

      // حجوزات نشطة دلوقتي
      this.prisma.booking.count({
        where: {
          car: { ownerId: owner.id },
          status: { in: [BookingStatus.ACTIVE, BookingStatus.IN_DELIVERY] },
        },
      }),

      // حجوزات الشهر ده
      this.prisma.booking.count({
        where: {
          car: { ownerId: owner.id },
          status: BookingStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
      }),

      // إيرادات الشهر (بعد الـ commission)
      this.prisma.booking.aggregate({
        where: {
          car: { ownerId: owner.id },
          status: BookingStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
        _sum: { ownerPayout: true },
      }),

      // إيرادات كلية
      this.prisma.booking.aggregate({
        where: {
          car: { ownerId: owner.id },
          status: BookingStatus.COMPLETED,
        },
        _sum: { ownerPayout: true },
      }),

      // متوسط التقييم
      this.prisma.review.aggregate({
        where: {
          revieweeId: owner.userId,
          targetType: 'OWNER',
        },
        _avg: { rating: true },
      }),
    ]);

    return {
      cars: { total: totalCars, available: availableCars },
      bookings: { pending: pendingBookings, active: activeBookings },
      revenue: {
        thisMonth: monthlyRevenue._sum.ownerPayout || 0,
        total: totalRevenue._sum.ownerPayout || 0,
        monthlyBookings,
      },
      rating: {
        average: avgRating._avg.rating || 0,
      },
    };
  }

  // آخر 30 حجز للـ owner
  async getRecentBookings(userId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) throw new NotFoundException('Owner not found');

    return this.prisma.booking.findMany({
      where: { car: { ownerId: owner.id } },
      include: {
        user: { select: { name: true, phone: true } },
        car: { select: { make: true, model: true } },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ─── مسارات الآدمين لإدارة وتوثيق المعارض (Admin only) ──────────────────────

  // جلب المعارض المعلقة (غير الموثقة)
  async findPendingOwners() {
    return this.prisma.owner.findMany({
      where: { isVerified: false },
      include: {
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // توثيق المعرض
  async verifyOwner(id: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) throw new NotFoundException('المعرض غير موجود');

    const updated = await this.prisma.owner.update({
      where: { id },
      data: { isVerified: true },
    });

    // إرسال إشعار لصاحب المعرض بالتوثيق
    await this.notifications.send(owner.userId, {
      type: 'OWNER_VERIFIED',
      title: 'تم توثيق معرضك بنجاح! 🌟',
      body: `تهانينا! تم التحقق من مستندات معرضك "${owner.businessName}" وتوثيقه بالكامل على المنصة. يمكنك الآن استقبال الحجوزات ونشر السيارات.`,
      data: { ownerId: owner.id },
    });

    return updated;
  }

  // إلغاء توثيق المعرض
  async unverifyOwner(id: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id } });
    if (!owner) throw new NotFoundException('المعرض غير موجود');

    const updated = await this.prisma.owner.update({
      where: { id },
      data: { isVerified: false },
    });

    // إرسال إشعار لصاحب المعرض بإلغاء التوثيق
    await this.notifications.send(owner.userId, {
      type: 'OWNER_UNVERIFIED',
      title: 'تنبيه: إلغاء توثيق المعرض ⚠️',
      body: `تم إلغاء توثيق معرضك "${owner.businessName}" من قبل الإدارة. يرجى التواصل مع الدعم الفني للمزيد من التفاصيل.`,
      data: { ownerId: owner.id },
    });

    return updated;
  }
}
