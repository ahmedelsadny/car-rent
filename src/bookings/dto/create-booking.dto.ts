import {
  IsString, IsDateString, IsOptional, IsNumber,
  IsUUID, IsBoolean, IsEnum, IsUrl, Min, MaxLength,
  ValidateIf, IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-car' })
  @IsUUID()
  carId: string;

  @ApiProperty({ example: '2025-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-07-05' })
  @IsDateString()
  endDate: string;

  // ── نوع التوصيل ──
  @ApiProperty({ enum: ['HOME', 'PICKUP'], example: 'HOME' })
  @IsEnum(['HOME', 'PICKUP'])
  deliveryType: 'HOME' | 'PICKUP';

  // لو HOME → مطلوب
  @ApiProperty({ example: '15 شارع التحرير، القاهرة', required: false })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiProperty({ example: 30.0444, required: false })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsNumber()
  deliveryLat?: number;

  @ApiProperty({ example: 31.2357, required: false })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsNumber()
  deliveryLng?: number;

  // ── السواق ──
  @ApiProperty({ example: false, description: 'هل يريد سواق؟' })
  @IsBoolean()
  withDriver: boolean;

  @ApiProperty({ example: 'محمد أحمد', required: false, description: 'اسم سائق إضافي' })
  @IsOptional()
  @IsString()
  additionalDriver?: string;

  // ── التأمين ──
  @ApiProperty({ enum: ['BASIC', 'COMPREHENSIVE'], example: 'BASIC', required: false })
  @IsOptional()
  @IsEnum(['BASIC', 'COMPREHENSIVE'])
  insuranceType?: 'BASIC' | 'COMPREHENSIVE';

  // ── وثائق (URLs بعد الرفع على /uploads/image) ──
  @ApiProperty({ example: 'http://localhost:3000/uploads/abc123.jpg' })
  @IsUrl()
  nationalIdImageUrl: string;

  @ApiProperty({ example: 'http://localhost:3000/uploads/def456.jpg' })
  @IsUrl()
  driverLicenseUrl: string;

  // ── كوبون ──
  @ApiProperty({ example: 'SUMMER20', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  // ── ملاحظات ──
  @ApiProperty({ example: 'محتاج كرسي أطفال', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}
