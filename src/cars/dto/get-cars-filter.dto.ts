import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCarsFilterDto {
  @ApiPropertyOptional({ example: 'Toyota', description: 'تصفية بالشركة' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Corolla', description: 'تصفية بالموديل' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'automatic', enum: ['automatic', 'manual'] })
  @IsOptional()
  @IsIn(['automatic', 'manual'])
  transmission?: string;

  @ApiPropertyOptional({ example: 200, description: 'الحد الأدنى للسعر اليومي' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000, description: 'الحد الأقصى للسعر اليومي' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;



  @ApiPropertyOptional({ example: 1, description: 'رقم الصفحة للـ pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'عدد النتائج في الصفحة' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}
