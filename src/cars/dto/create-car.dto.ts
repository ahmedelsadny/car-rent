import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsUrl,
  Min,
  Max,
  IsInt,
  IsIn,
  MinLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MinLength(2)
  make: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @MinLength(2)
  model: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year: number;

  @ApiProperty({ example: 'أ ب ج 1234' })
  @IsString()
  licensePlate: string;

  @ApiProperty({ example: 'أبيض' })
  @IsString()
  color: string;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pricePerDay: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  depositAmount?: number;

  @ApiPropertyOptional({ example: ['AC', 'بلوتوث', 'GPS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: ['https://r2.example.com/car1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'كل عنصر في imageUrls يجب أن يكون رابطاً صالحاً' })
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'automatic', enum: ['automatic', 'manual'] })
  @IsOptional()
  @IsIn(['automatic', 'manual'])
  transmission?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(15)
  @Type(() => Number)
  seats?: number;

  @ApiPropertyOptional({ example: 30.0444 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ example: 31.2357 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'هل السيارة تُأجَّر بسواق فقط؟',
  })
  @IsOptional()
  @IsBoolean()
  driverRequired?: boolean;

  @ApiPropertyOptional({
    example: '2026-06-01',
    description: 'تاريخ بداية إتاحة السيارة للإيجار',
  })
  @IsOptional()
  @IsDateString({}, { message: 'تاريخ بداية الإتاحة غير صالح' })
  availableFrom?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'تاريخ نهاية إتاحة السيارة للإيجار',
  })
  @IsOptional()
  @IsDateString({}, { message: 'تاريخ نهاية الإتاحة غير صالح' })
  availableTo?: string;
}
