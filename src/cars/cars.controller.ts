import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { GetCarsFilterDto } from './dto/get-cars-filter.dto';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SetSnoozeDto {
  @ApiPropertyOptional({ example: '2026-08-01', description: 'تاريخ العودة. إرسال null يلغي السنوز.' })
  @IsOptional()
  @IsDateString()
  until?: string | null;
}

@ApiTags('Cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // ─── مسارات عامة (للعملاء بدون تسجيل دخول) ───────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'تصفح السيارات المتاحة',
    description: 'يمكن تصفيتها بالسعر، الموديل، الشركة، أو الموقع الجغرافي',
  })
  findAll(@Query() filters: GetCarsFilterDto) {
    return this.carsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل سيارة معينة مع التقييمات' })
  @ApiResponse({ status: 404, description: 'السيارة غير موجودة' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOne(id);
  }

  @Post(':id/checkout-lock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'قفل السيارة مؤقتاً لمدة 10 دقائق أثناء التشيك أوت' })
  setCheckoutLock(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.carsService.setCheckoutLock(userId, id);
  }

  // ─── مسارات المعارض (تحتاج JWT + OwnerGuard) ─────────────────────────────

  @Get('owner/my-cars')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'جلب كل سيارات المعرض الحالي' })
  findOwnerCars(@CurrentUser('id') userId: string) {
    return this.carsService.findOwnerCars(userId);
  }

  // ─── مسارات الآدمين (تحتاج JWT + AdminGuard) ─────────────────────────────

  @Get('admin/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'جلب السيارات التي تنتظر الموافقة (للآدمين فقط)' })
  findPendingCars() {
    return this.carsService.findPendingCars();
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'الموافقة على نشر سيارة (للآدمين فقط)' })
  approveCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.approveCar(id);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'رفض نشر سيارة (للآدمين فقط)' })
  rejectCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.rejectCar(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'إضافة سيارة جديدة للمعرض' })
  @ApiResponse({ status: 409, description: 'رقم اللوحة مسجل بالفعل' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCarDto,
  ) {
    return this.carsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'تعديل بيانات سيارة (المعرض فقط)' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarDto,
  ) {
    return this.carsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف سيارة (المعرض فقط)' })
  @ApiResponse({ status: 400, description: 'لا يمكن حذف سيارة لها حجوزات نشطة' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.carsService.remove(userId, id);
  }

  // ─── فترات الحظر (Availability Blocks) ───────────────────────────────────────────

  @Post('availability-blocks')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({
    summary: 'إضافة فترة حظر لسيارة',
    description: 'بيتحقق تلقائياً من عدم وجود حجوزات نشطة في نفس الفترة. لو فيه تعارض → بيرجع رقم الحجز المتعارض.',
  })
  @ApiResponse({ status: 409, description: 'يوجد حجز نشط متعارض' })
  addAvailabilityBlock(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAvailabilityBlockDto,
  ) {
    return this.carsService.addAvailabilityBlock(userId, dto);
  }

  @Get(':id/availability-blocks')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'جلب فترات الحظر لسيارة معينة' })
  getAvailabilityBlocks(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.carsService.getAvailabilityBlocks(userId, id);
  }

  @Delete('availability-blocks/:blockId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف فترة حظر معينة' })
  removeAvailabilityBlock(
    @CurrentUser('id') userId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ) {
    return this.carsService.removeAvailabilityBlock(userId, blockId);
  }

  // ─── زرار إجازة المعرض (Snooze) ─────────────────────────────────────────────────

  @Patch('owner/snooze')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({
    summary: 'تفعيل / إلغاء وضع الإجازة للمعرض',
    description: 'أرسل { "until": "2026-08-01" } للتفعيل. أرسل { "until": null } للإلغاء الفوري.',
  })
  setSnooze(
    @CurrentUser('id') userId: string,
    @Body() dto: SetSnoozeDto,
  ) {
    return this.carsService.setShowroomSnooze(userId, dto.until ?? null);
  }
}

