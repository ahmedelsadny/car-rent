import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterOwnerDto {
  @ApiProperty({ example: 'معرض النيل للسيارات' })
  @IsString()
  @MinLength(3)
  businessName: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  commercialReg?: string;

  @ApiPropertyOptional({ example: '15 شارع التحرير، القاهرة' })
  @IsOptional()
  @IsString()
  address?: string;
}
