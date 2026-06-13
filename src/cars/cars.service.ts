import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { GetCarsFilterDto } from './dto/get-cars-filter.dto';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { BookingStatus, CarStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CarsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
  ) {}

  // ── إضافة سيارة جديدة (خاص بالمعارض) ──
  async create(userId: string, dto: CreateCarDto) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) throw new ForbiddenException('Owner account required');

    // تحقق من عدم تكرار لوحة السيارة
    const existing = await this.prisma.car.findUnique({
      where: { licensePlate: dto.licensePlate },
    });
    if (existing) throw new ConflictException('رقم اللوحة مسجل بالفعل');

    return this.prisma.car.create({
      data: {
        ownerId: owner.id,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        licensePlate: dto.licensePlate,
        color: dto.color,
        pricePerDay: dto.pricePerDay,
        depositAmount: dto.depositAmount ?? 0,
        features: dto.features ?? [],
        imageUrls: dto.imageUrls ?? [],
        transmission: dto.transmission ?? 'automatic',
        seats: dto.seats ?? 5,
        lat: dto.lat,
        lng: dto.lng,
        driverRequired: dto.driverRequired ?? false,
        status: CarStatus.AVAILABLE,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        availableTo: dto.availableTo ? new Date(dto.availableTo) : null,
      },
    });
  }

  // ── جلب كل السيارات المتاحة للعملاء مع التصفية ──
  async findAll(filters: GetCarsFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: CarStatus.AVAILABLE,
      isApproved: true,
      // فلترة السنوز: محتاجين لسيارات معارضها مش في وضع الإجازة
      owner: {
        OR: [
          { snoozeUntil: null },
          { snoozeUntil: { lt: new Date() } },
        ],
      },
    };

    if (filters.make) {
      where.make = { contains: filters.make, mode: 'insensitive' };
    }
    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }
    if (filters.transmission) {
      where.transmission = filters.transmission;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.pricePerDay = {};
      if (filters.minPrice !== undefined) where.pricePerDay.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.pricePerDay.lte = filters.maxPrice;
    }

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
              user: { select: { name: true, phone: true } },
            },
          },
          // متوسط التقييم — نجلب آخر 3 تقييمات فقط
          bookings: {
            where: { status: 'COMPLETED' },
            select: {
              reviews: {
                where: { targetType: 'CAR' },
                select: { rating: true },
                take: 3,
              },
            },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.car.count({ where }),
    ]);

    // ── Car Cooldown Filter ──
    // بنستخدم mget مرة واحدة بدل exists لكل سيارة على حدة (أداء أفضل)
    const cooldownKeys = cars.map((c) => `cooldown:${c.id}`);
    const cooldownValues = cooldownKeys.length
      ? await this.redis.getClient().mget(...cooldownKeys)
      : [];
    const coolingSet = new Set(
      cars
        .filter((_, i) => cooldownValues[i] !== null)
        .map((c) => c.id),
    );

    // حساب التقييم المتوسط لكل سيارة
    const carsWithRating = cars
      .filter((car) => !coolingSet.has(car.id)) // إزالة السيارات في فترة الـ cooldown
      .map((car) => {
      const allRatings = car.bookings.flatMap((b) => b.reviews.map((r) => r.rating));
      const avgRating = allRatings.length
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

      // حساب المسافة إن كانت الإحداثيات موجودة
      let distanceKm: number | null = null;
      if (filters.lat && filters.lng && car.lat && car.lng) {
        distanceKm = this.calcDistance(filters.lat, filters.lng, car.lat, car.lng);
      }

      const { bookings, ...carData } = car;
      return { ...carData, avgRating: Math.round(avgRating * 10) / 10, distanceKm };
    });

    // ترتيب بالمسافة إن كانت الإحداثيات موجودة
    if (filters.lat && filters.lng) {
      carsWithRating.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    // تصفية بالمسافة المحددة
    const filtered =
      filters.lat && filters.lng && filters.distance
        ? carsWithRating.filter((c) => c.distanceKm !== null && c.distanceKm <= filters.distance!)
        : carsWithRating;

    return {
      data: filtered,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── تفاصيل سيارة واحدة للعملاء ──
  async findOne(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
            isVerified: true,
            commissionRate: true,
            user: { select: { name: true, phone: true } },
          },
        },
        bookings: {
          where: { status: { in: ['COMPLETED'] } },
          select: {
            reviews: {
              where: { targetType: 'CAR' },
              select: {
                rating: true,
                comment: true,
                createdAt: true,
                reviewer: { select: { name: true, avatarUrl: true } },
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!car || !car.isApproved) throw new NotFoundException('السيارة غير موجودة');

    const allReviews = car.bookings.flatMap((b) => b.reviews);
    const avgRating = allReviews.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const { bookings, ...carData } = car;
    return {
      ...carData,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
      reviews: allReviews.slice(0, 5),
    };
  }

  // ── سيارات المعرض الحالي ──
  async findOwnerCars(userId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) throw new ForbiddenException('Owner account required');

    return this.prisma.car.findMany({
      where: { ownerId: owner.id },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // ── تعديل سيارة (المعرض فقط) ──
  async update(userId: string, carId: string, dto: UpdateCarDto) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { owner: true },
    });

    if (!car) throw new NotFoundException('السيارة غير موجودة');
    if (car.owner.userId !== userId) throw new ForbiddenException('ليس لديك صلاحية التعديل');

    // إذا الـ status موجود، نعمله cast صح
    const data: any = { ...dto };
    if (dto.status) data.status = dto.status as CarStatus;
    if (dto.availableFrom !== undefined) {
      data.availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : null;
    }
    if (dto.availableTo !== undefined) {
      data.availableTo = dto.availableTo ? new Date(dto.availableTo) : null;
    }

    return this.prisma.car.update({
      where: { id: carId },
      data,
    });
  }

  // ── حذف سيارة (المعرض فقط) ──
  async remove(userId: string, carId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { owner: true },
    });

    if (!car) throw new NotFoundException('السيارة غير موجودة');
    if (car.owner.userId !== userId) throw new ForbiddenException('ليس لديك صلاحية الحذف');

    // تحقق من عدم وجود حجوزات نشطة
    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        carId,
        status: { in: ['PENDING_PAYMENT', 'PENDING_OWNER_APPROVAL', 'CONFIRMED', 'IN_DELIVERY', 'ACTIVE'] },
      },
    });
    if (activeBooking) {
      throw new BadRequestException('لا يمكن حذف سيارة لها حجوزات نشطة');
    }

    await this.prisma.car.delete({ where: { id: carId } });
    return { message: 'تم حذف السيارة بنجاح' };
  }

  // ── جلب السيارات التي تنتظر الموافقة (Admin only) ──
  async findPendingCars() {
    return this.prisma.car.findMany({
      where: { isApproved: false },
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── قبول نشر السيارة (Admin only) ──
  async approveCar(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException('السيارة غير موجودة');

    const updated = await this.prisma.car.update({
      where: { id },
      data: { isApproved: true },
    });

    // إرسال إشعار للمعرض
    await this.notifications.send(car.owner.userId, {
      type: 'CAR_PUBLISH_APPROVED',
      title: 'تم قبول سيارتك! 🎉',
      body: `تمت الموافقة على نشر سيارتك ${car.make} ${car.model} بنجاح وهي الآن متاحة للعملاء.`,
      data: { carId: car.id },
    });

    return updated;
  }

  // ── رفض/إلغاء قبول نشر السيارة (Admin only) ──
  async rejectCar(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException('السيارة غير موجودة');

    const updated = await this.prisma.car.update({
      where: { id },
      data: { isApproved: false },
    });

    // إرسال إشعار للمعرض
    await this.notifications.send(car.owner.userId, {
      type: 'CAR_PUBLISH_REJECTED',
      title: 'تم رفض نشر سيارتك ⚠️',
      body: `للأسف تم رفض نشر سيارتك ${car.make} ${car.model} من قبل الإدارة.`,
      data: { carId: car.id },
    });

    return updated;
  }

  // ── حساب المسافة بين نقطتين (Haversine formula) ──
  private calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  // ────────────────────────────────────────────────────────────
  // ── إدارة فترات الحظر (Availability Blocks) ──────────────────
  // ────────────────────────────────────────────────────────────

  /**
   * إضافة بلوك حظر جديد لسيارة — بيتحقق من عدم تعارضه مع حجوزات نشطة موجودة
   */
  async addAvailabilityBlock(userId: string, dto: CreateAvailabilityBlockDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException({
        ar: 'تاريخ النهاية لازم يكون بعد تاريخ البداية',
        en: 'End date must be after start date',
      });
    }

    // تحقق من صلاحية المعرض على هذه السيارة
    const car = await this.prisma.car.findUnique({
      where: { id: dto.carId },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException({
      ar: 'السيارة غير موجودة',
      en: 'Car not found',
    });
    if (car.owner.userId !== userId) throw new ForbiddenException({
      ar: 'ليس لديك صلاحية لتعديل هذه السيارة',
      en: 'You do not own this car',
    });

    // ✔️ فحص التعارض مع الحجوزات النشطة (CONFIRMED / ACTIVE / IN_DELIVERY)
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        carId: dto.carId,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.ACTIVE,
            BookingStatus.IN_DELIVERY,
          ],
        },
        AND: [
          { startDate: { lte: end } },
          { endDate:   { gte: start } },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictException({
        ar: `لا يمكن حظر هذه الفترة — يوجد حجز نشط برقم [${conflictingBooking.bookingCode || conflictingBooking.id}]. يرجى إلغاء الحجز أولاً أو التواصل مع العميل.`,
        en: `Cannot block this period — there is an active booking [${conflictingBooking.bookingCode || conflictingBooking.id}]. Please cancel it first or contact the customer.`,
        bookingCode: conflictingBooking.bookingCode,
        bookingId:   conflictingBooking.id,
      });
    }

    return this.prisma.carAvailabilityBlock.create({
      data: {
        carId: dto.carId,
        startDate: start,
        endDate: end,
        reason: dto.reason,
      },
    });
  }

  /**
   * جلب كل بلوكات الحظر لسيارة معينة
   */
  async getAvailabilityBlocks(userId: string, carId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      include: { owner: true },
    });
    if (!car) throw new NotFoundException({ ar: 'السيارة غير موجودة', en: 'Car not found' });
    if (car.owner.userId !== userId) throw new ForbiddenException({ ar: 'ليس لديك صلاحية', en: 'Forbidden' });

    return this.prisma.carAvailabilityBlock.findMany({
      where: { carId },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * حذف بلوك حظر معين
   */
  async removeAvailabilityBlock(userId: string, blockId: string) {
    const block = await this.prisma.carAvailabilityBlock.findUnique({
      where: { id: blockId },
      include: { car: { include: { owner: true } } },
    });
    if (!block) throw new NotFoundException({ ar: 'البلوك غير موجود', en: 'Block not found' });
    if (block.car.owner.userId !== userId) throw new ForbiddenException({ ar: 'ليس لديك صلاحية', en: 'Forbidden' });

    await this.prisma.carAvailabilityBlock.delete({ where: { id: blockId } });
    return {
      ar: 'تم حذف بلوك الحظر بنجاح',
      en: 'Availability block removed successfully',
    };
  }

  // ────────────────────────────────────────────────────────────
  // ── زرار إجازة المعرض (Showroom Snooze) ─────────────────────
  // ────────────────────────────────────────────────────────────

  /**
   * تفعيل / إلغاء وضع الإجازة للمعرض — يخفي كل سياراته من البحث حتى تاريخ معين
   * @param until — لو null → إلغاء السنوز فوراً
   */
  async setShowroomSnooze(userId: string, until: string | null) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    if (!owner) throw new NotFoundException({ ar: 'حساب المعرض غير موجود', en: 'Owner account not found' });

    const snoozeUntil = until ? new Date(until) : null;

    const updated = await this.prisma.owner.update({
      where: { userId },
      data: { snoozeUntil },
    });

    if (snoozeUntil) {
      return {
        ar: `تم تفعيل وضع الإجازة. جميع سياراتك مخفية حتى ${snoozeUntil.toISOString().split('T')[0]}.`,
        en: `Snooze activated. All your cars are hidden until ${snoozeUntil.toISOString().split('T')[0]}.`,
        snoozeUntil: updated.snoozeUntil,
      };
    } else {
      return {
        ar: 'تم إلغاء وضع الإجازة. سياراتك متاحة للعملاء مرة أخرى.',
        en: 'Snooze deactivated. Your cars are now visible to customers.',
        snoozeUntil: null,
      };
    }
  }
}

