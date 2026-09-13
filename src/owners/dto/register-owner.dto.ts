import { IsString, IsOptional, MinLength, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerType } from '@prisma/client';

export class RegisterOwnerDto {
  @ApiPropertyOptional({ enum: OwnerType, default: OwnerType.SHOWROOM, description: 'نوع الحساب: معرض أو مالك فردي' })
  @IsOptional()
  @IsEnum(OwnerType)
  ownerType?: OwnerType;

  @ApiPropertyOptional({ example: 'معرض النيل للسيارات' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'السجل التجاري (إلزامي للمعرض عند التوثيق)' })
  @IsOptional()
  @IsString()
  commercialReg?: string;

  @ApiPropertyOptional({ example: '29901011234567', description: 'الرقم القومي (للمالك الفردي)' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: 'https://r2.carrent.com/ids/front.jpg', description: 'صورة بطاقة الرقم القومي وجه' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط صورة البطاقة غير صالح' })
  idCardFrontUrl?: string;

  @ApiPropertyOptional({ example: 'https://r2.carrent.com/ids/back.jpg', description: 'صورة بطاقة الرقم القومي ظهر' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط صورة البطاقة غير صالح' })
  idCardBackUrl?: string;

  @ApiPropertyOptional({ example: 'https://r2.carrent.com/bills/electric.jpg', description: 'إيصال مرافق حديث لإثبات محل السكن' })
  @IsOptional()
  @IsUrl({}, { message: 'رابط إيصال المرافق غير صالح' })
  utilityBillUrl?: string;

  @ApiPropertyOptional({ example: '15 شارع التحرير، القاهرة' })
  @IsOptional()
  @IsString()
  address?: string;

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
