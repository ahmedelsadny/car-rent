import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAvailabilityBlockDto {
  @ApiProperty({ example: 'uuid-of-car', description: 'معرف السيارة' })
  @IsUUID()
  carId: string;

  @ApiProperty({ example: '2026-07-10', description: 'تاريخ بداية الحظر' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-07-15', description: 'تاريخ نهاية الحظر' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'صيانة دورية', description: 'سبب الحظر (اختياري)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
