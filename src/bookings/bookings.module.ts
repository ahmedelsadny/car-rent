import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  // RedisModule هو @Global مسجل في AppModule — مش محتاج نعيد استيراده
  imports: [NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
