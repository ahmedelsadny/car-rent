import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  // ── Admin: إنشاء كوبون ──
  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException('الكود موجود بالفعل');

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountPercent: dto.discountPercent,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  // ── Admin: قائمة الكوبونات ──
  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: تعطيل كوبون ──
  async deactivate(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── User: التحقق من الكوبون وحساب الخصم ──
  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) throw new NotFoundException('كود الخصم غير صحيح');
    if (!coupon.isActive) throw new BadRequestException('كود الخصم غير مفعل');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('كود الخصم انتهت صلاحيته');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('كود الخصم وصل للحد الأقصى من الاستخدامات');
    }

    const discountAmount = Math.round((subtotal * coupon.discountPercent) / 100 * 100) / 100;
    const finalPrice = Math.max(0, subtotal - discountAmount);

    return {
      couponId: coupon.id,
      discountPercent: coupon.discountPercent,
      discountAmount,
      finalPrice,
    };
  }

  // ── Internal: استخدام الكوبون (بعد إنشاء الحجز) ──
  async incrementUsage(couponId: string) {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }
}
