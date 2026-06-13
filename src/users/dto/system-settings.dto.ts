import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemSettingDto {
  @ApiProperty({ example: '150' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
