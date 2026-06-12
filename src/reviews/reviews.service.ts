import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus, ReviewTargetType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    // تحقق إن الحجز موجود وكامل
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { car: { include: { owner: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.userId !== reviewerId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ForbiddenException('Can only review completed bookings');
    }

    // تحقق إنه مش عامل review قبل كده لنفس الـ booking + target
    const existing = await this.prisma.review.findFirst({
      where: {
        bookingId: dto.bookingId,
        reviewerId,
        targetType: dto.targetType as ReviewTargetType,
      },
    });
    if (existing) throw new ConflictException('Already reviewed');

    // حدد الـ reviewee حسب الـ target type
    let revieweeId: string;
    if (dto.targetType === 'OWNER') {
      revieweeId = booking.car.owner.userId;
    } else {
      // CAR review — reviewee هو الـ owner برضو
      revieweeId = booking.car.owner.userId;
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        reviewerId,
        revieweeId,
        targetType: dto.targetType as ReviewTargetType,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  // تقييمات سيارة معينة مع المتوسط
  async getCarReviews(carId: string) {
    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          booking: { carId },
          targetType: ReviewTargetType.CAR,
        },
        include: {
          reviewer: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.review.aggregate({
        where: {
          booking: { carId },
          targetType: ReviewTargetType.CAR,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.rating,
      reviews,
    };
  }

  // تقييمات owner معين
  async getOwnerReviews(ownerUserId: string) {
    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          revieweeId: ownerUserId,
          targetType: ReviewTargetType.OWNER,
        },
        include: {
          reviewer: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.review.aggregate({
        where: {
          revieweeId: ownerUserId,
          targetType: ReviewTargetType.OWNER,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.rating,
      reviews,
    };
  }
}
