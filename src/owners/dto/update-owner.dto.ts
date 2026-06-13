import { IsString, IsOptional, MinLength, IsNumber, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOwnerDto {
  @ApiPropertyOptional({ example: 'معرض النيل للسيارات' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  businessName?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  commercialReg?: string;

  @ApiPropertyOptional({ example: '15 شارع التحرير، القاهرة' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '15 شارع التحرير، القاهرة' })
  @IsOptional()
  @IsString()
  branchAddress?: string;

  @ApiPropertyOptional({ example: 30.0444 })
  @IsOptional()
  @IsNumber()
  branchLat?: number;

  @ApiPropertyOptional({ example: 31.2357 })
  @IsOptional()
  @IsNumber()
  branchLng?: number;

  @ApiPropertyOptional({ example: 'EG12345678901234567890123' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'https://r2.carrent.com/logos/nile.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط اللوجو غير صالح' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://r2.carrent.com/covers/nile.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الغلاف غير صالح' })
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'أفضل معرض لتأجير السيارات الفخمة في القاهرة' })
  @IsOptional()
  @IsString()
  description?: string;
}
