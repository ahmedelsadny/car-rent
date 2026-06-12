import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OwnersModule } from './owners/owners.module';
import { CarsModule } from './cars/cars.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { UploadsModule } from './uploads/uploads.module';
import { CouponsModule } from './coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Redis مشترك بين كل الـ modules (@Global)
    RedisModule,

    // Global rate limiting: 100 requests/دقيقة لكل IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    PrismaModule,
    AuthModule,
    UsersModule,
    OwnersModule,
    CarsModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    UploadsModule,
    CouponsModule,
  ],
  providers: [
    // تطبيق الـ throttling على كل الـ endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
