import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
