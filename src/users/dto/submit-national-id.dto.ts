import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEgyptianNationalId } from '../../common/pipes/validation.helpers';

export class SubmitNationalIdDto {
  @ApiProperty({ example: '29501021234567' })
  @IsEgyptianNationalId()
  nationalId: string;

  @ApiProperty({ example: 'https://r2.carrent.com/national-ids/photo.jpg' })
  @IsUrl({}, { message: 'رابط الصورة غير صالح' })
  imageUrl: string;
}
