import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCarDto } from './create-car.dto';

export class UpdateCarDto extends PartialType(CreateCarDto) {
  @ApiPropertyOptional({
    example: 'MAINTENANCE',
    enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
    description: 'تحديث حالة السيارة',
  })
  @IsOptional()
  @IsIn(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'])
  status?: string;
}
