import {
  IsString, IsDateString, IsOptional, IsNumber,
  IsUUID, IsBoolean, IsEnum, ValidateIf, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EstimateBookingDto {
  @ApiProperty({ example: 'uuid-of-car' })
  @IsUUID()
  carId: string;

  @ApiProperty({ example: '2025-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-07-05' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: ['HOME', 'PICKUP'], example: 'HOME' })
  @IsEnum(['HOME', 'PICKUP'])
  deliveryType: 'HOME' | 'PICKUP';

  @ApiPropertyOptional({ example: '15 شارع التحرير، القاهرة' })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 30.0444 })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsNumber()
  deliveryLat?: number;

  @ApiPropertyOptional({ example: 31.2357 })
  @ValidateIf(o => o.deliveryType === 'HOME')
  @IsNumber()
  deliveryLng?: number;

  @ApiProperty({ example: false, description: 'هل يريد سواق؟' })
  @IsBoolean()
  withDriver: boolean;

  @ApiPropertyOptional({ example: 'محمد أحمد', description: 'اسم سائق إضافي' })
  @IsOptional()
  @IsString()
  additionalDriver?: string;

  @ApiPropertyOptional({ enum: ['BASIC'], example: 'BASIC' })
  @IsOptional()
  @IsEnum(['BASIC'])
  insuranceType?: 'BASIC';

  @ApiPropertyOptional({ example: 'SUMMER20' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
