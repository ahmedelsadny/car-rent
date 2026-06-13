import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationTemplateDto {
  @ApiProperty({ example: 'تم قبول سيارتك! 🎉' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'تمت الموافقة على نشر سيارتك {make} {model} بنجاح وهي الآن متاحة للعملاء.' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class CreateNotificationTemplateDto extends UpdateNotificationTemplateDto {
  @ApiProperty({ example: 'CAR_PUBLISH_APPROVED' })
  @IsString()
  @IsNotEmpty()
  type: string;
}
