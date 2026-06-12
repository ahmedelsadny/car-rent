import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER20' })
  @IsString()
  code: string;

  @ApiProperty({ example: 20, description: 'نسبة الخصم (1-100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @ApiProperty({ example: 100, required: false, description: 'أقصى عدد استخدامات (null = غير محدود)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
