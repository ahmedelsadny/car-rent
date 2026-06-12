import { IsString, IsDateString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
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

  @ApiProperty({ example: '15 شارع التحرير، القاهرة' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ example: 30.0444 })
  @IsNumber()
  deliveryLat: number;

  @ApiProperty({ example: 31.2357 })
  @IsNumber()
  deliveryLng: number;

  @ApiProperty({ example: 75, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;
}
