import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء حجز جديد' })
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'حجوزاتي كعميل' })
  getMyBookings(@Request() req) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('owner')
  @ApiOperation({ summary: 'الطلبات الواردة للـ owner' })
  getOwnerBookings(
    @Request() req,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.getOwnerBookings(req.user.id, status);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Owner يقبل أو يرفض الحجز' })
  respond(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { action: 'accept' | 'reject'; reason?: string },
  ) {
    return this.bookingsService.respondToBooking(
      req.user.id,
      id,
      body.action,
      body.reason,
    );
  }
}
