import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER20' })
  @IsString()
  code: string;

  @ApiProperty({ example: 500, description: 'المبلغ الأساسي للحجز (بدون رسوم)' })
  @IsNumber()
  @Min(1)
  subtotal: number;
}

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ── User: التحقق من الكوبون ──
  @Post('validate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'التحقق من كود الخصم وحساب التوفير' })
  validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto.code, dto.subtotal);
  }

  // ── Admin only ──
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '[Admin] إنشاء كوبون جديد' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '[Admin] قائمة الكوبونات' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '[Admin] تعطيل كوبون' })
  deactivate(@Param('id') id: string) {
    return this.couponsService.deactivate(id);
  }
}
