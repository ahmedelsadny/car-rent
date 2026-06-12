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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OwnerGuard } from '../common/guards/owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { GetCarsFilterDto } from './dto/get-cars-filter.dto';

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

  // ─── مسارات المعارض (تحتاج JWT + OwnerGuard) ─────────────────────────────

  @Get('owner/my-cars')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, OwnerGuard)
  @ApiOperation({ summary: 'جلب كل سيارات المعرض الحالي' })
  findOwnerCars(@CurrentUser('id') userId: string) {
    return this.carsService.findOwnerCars(userId);
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
}
