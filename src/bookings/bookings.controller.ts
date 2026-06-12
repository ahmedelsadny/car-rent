import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

class CancelBookingDto {
  @ApiProperty({ example: 'غيرت رأيي', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ── إنشاء حجز (يبدأ بـ PENDING_PAYMENT) ──
  @Post()
  @ApiOperation({ summary: 'إنشاء حجز جديد — يبدأ Slot Lock في Redis' })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  // ── تأكيد فوري بعد الدفع (Instant Confirm) ──
  // في الغالب بيُستدعى من Payment Webhook — لكن متاح هنا للاختبار
  @Post(':id/confirm')
  @ApiOperation({ summary: 'تأكيد الحجز فوراً بعد الدفع (Instant Confirm)' })
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirmAfterPayment(id);
  }

  // ── إلغاء الحجز + Car Cooldown 3 ساعات ──
  @Delete(':id')
  @ApiOperation({ summary: 'إلغاء حجز — العربية بتختفي من البحث 3 ساعات' })
  cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(req.user.id, id, dto.reason);
  }

  // ── حجوزاتي كعميل ──
  @Get('my')
  @ApiOperation({ summary: 'حجوزاتي كعميل' })
  getMyBookings(@Request() req) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  // ── الطلبات الواردة للـ owner ──
  @Get('owner')
  @ApiOperation({ summary: 'الحجوزات الواردة للمعرض' })
  getOwnerBookings(
    @Request() req,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.getOwnerBookings(req.user.id, status);
  }
}
