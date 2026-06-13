import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        avatarUrl: true,
        verifiedAt: true,
        createdAt: true,
        owner: { select: { id: true, businessName: true, isVerified: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // لو بيغير الإيميل، تحقق إنه مش موجود
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true, name: true, email: true, phone: true, avatarUrl: true,
      },
    });
  }

  // تحقق من الهوية الوطنية
  async submitNationalId(userId: string, nationalId: string, imageUrl: string) {
    // هنا ممكن تضيف integration مع خدمة verification
    // دلوقتي بنحفظ بس وننتظر manual review
    await this.prisma.user.update({
      where: { id: userId },
      data: { nationalId },
    });

    return { message: 'National ID submitted for review' };
  }

  async getStats(userId: string) {
    const [totalBookings, completedBookings, totalSpent] = await Promise.all([
      this.prisma.booking.count({ where: { userId } }),
      this.prisma.booking.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.booking.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { subtotal: true },
      }),
    ]);

    return {
      totalBookings,
      completedBookings,
      totalSpent: totalSpent._sum.subtotal || 0,
    };
  }

  // ─── مسارات الآدمين لإدارة وتوثيق العملاء (Admin only) ──────────────────────

  // جلب المستخدمين المنتظرين التوثيق
  async findPendingVerifications() {
    return this.prisma.user.findMany({
      where: {
        nationalId: { not: null },
        verifiedAt: null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        nationalId: true,
        nationalIdImageUrl: true,
        driverLicenseUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // توثيق هوية المستخدم
  async verifyUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });

    // إرسال إشعار للعميل بتوثيق الحساب
    await this.notifications.send(id, {
      type: 'USER_VERIFIED',
      title: 'تم توثيق حسابك بنجاح! 🎉',
      body: 'تهانينا! تم التحقق من هويتك وتوثيق حسابك بالكامل. يمكنك الآن حجز واستئجار السيارات بكل سهولة.',
    });

    return updated;
  }

  // رفض وثائق هوية المستخدم وإعادة تعيين الحقول
  async rejectUserVerification(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        nationalId: null,
        nationalIdImageUrl: null,
        driverLicenseUrl: null,
        verifiedAt: null,
      },
    });

    // إرسال إشعار للعميل برفض طلب التوثيق
    await this.notifications.send(id, {
      type: 'USER_VERIFICATION_REJECTED',
      title: 'تنبيه: رفض وثائق الهوية الوطنية ⚠️',
      body: 'للأسف لم نتمكن من قبول مستندات الهوية المرفوعة. يرجى إعادة رفع صور واضحة لبطاقة الرقم القومي ورخصة القيادة لتتم مراجعتها مجدداً.',
    });

    return updated;
  }

  // جلب إحصائيات لوحة التحكم الكاملة للـ Admin
  async getAdminDashboardStats() {
    const [
      totalUsers,
      verifiedUsers,
      totalOwners,
      verifiedOwners,
      totalCars,
      approvedCars,
      rentedCars,
      availableCars,
      totalBookings,
      completedBookings,
      financials,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { verifiedAt: { not: null } } }),
      this.prisma.owner.count(),
      this.prisma.owner.count({ where: { isVerified: true } }),
      this.prisma.car.count(),
      this.prisma.car.count({ where: { isApproved: true } }),
      this.prisma.car.count({ where: { status: 'RENTED', isApproved: true } }),
      this.prisma.car.count({ where: { status: 'AVAILABLE', isApproved: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          platformCommission: true,
          ownerPayout: true,
          subtotal: true,
        },
      }),
    ]);

    return {
      users: { total: totalUsers, verified: verifiedUsers },
      owners: { total: totalOwners, verified: verifiedOwners },
      cars: {
        total: totalCars,
        approved: approvedCars,
        rented: rentedCars,
        available: availableCars,
      },
      bookings: { total: totalBookings, completed: completedBookings },
      financials: {
        totalCommission: financials._sum.platformCommission || 0,
        totalOwnerPayout: financials._sum.ownerPayout || 0,
        totalRentalRevenue: financials._sum.subtotal || 0,
      },
    };
  }

  // جلب إعدادات النظام (Admin only)
  async getSystemSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  // تحديث إعداد معين بالنظام (Admin only)
  async updateSystemSetting(key: string, value: string) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
