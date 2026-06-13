import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EstimateBookingDto } from './dto/estimate-booking.dto';
import { BookingStatus } from '@prisma/client';

class CancelBookingDto {
  @ApiProperty({ example: 'غيرت رأيي', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

class UpdateStatusDto {
  @ApiProperty({ enum: ['PENDING_PAYMENT', 'PENDING_OWNER_APPROVAL', 'CONFIRMED', 'IN_DELIVERY', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'], example: 'IN_DELIVERY' })
  @IsEnum(['PENDING_PAYMENT', 'PENDING_OWNER_APPROVAL', 'CONFIRMED', 'IN_DELIVERY', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'])
  status: BookingStatus;
}

class VerifyHandoverDto {
  @ApiProperty({ example: 'signed-jwt-token-here' })
  @IsString()
  token: string;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ── حساب التسعير التقديري (دون إنشاء حجز) ──
  @Post('estimate')
  @ApiOperation({ summary: 'حساب التسعير التقديري والخصومات (دون إنشاء حجز)' })
  estimatePrice(@Request() req, @Body() dto: EstimateBookingDto) {
    return this.bookingsService.estimatePrice(req.user.id, dto);
  }

  // ── إنشاء حجز (يبدأ بـ PENDING_PAYMENT) ──
  @Post()
  @ApiOperation({ summary: 'إنشاء حجز جديد — يبدأ Slot Lock في Redis' })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  // ── تأكيد فوري بعد الدفع (Instant Confirm) ──
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

  // ── مسارات الآدمين لتغيير الحالات والتسليم ──

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'تحديث حالة الحجز (للآدمين فقط — مثل تحويل الحالة إلى IN_DELIVERY)' })
  updateStatusAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingsService.updateBookingStatusAdmin(id, dto.status);
  }

  @Get('admin/:id/handover-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'توليد توكن مشفر للتسليم لعرضه كـ QR (للآدمين فقط)' })
  getHandoverToken(@Param('id') id: string) {
    return this.bookingsService.generateHandoverToken(id);
  }

  @Post(':id/verify-handover')
  @ApiOperation({ summary: 'تأكيد التسليم ومسح الـ QR (للعميل فقط)' })
  verifyHandover(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: VerifyHandoverDto,
  ) {
    return this.bookingsService.verifyHandover(req.user.id, id, dto.token);
  }
}
