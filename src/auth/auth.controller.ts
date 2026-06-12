import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SendOtpDto {
  @ApiProperty({ example: '+201012345678' })
  @IsString()
  @Matches(/^\+20[0-9]{10}$/, { message: 'رقم تليفون مصري غير صحيح' })
  phone: string;
}

class VerifyOtpDto {
  @ApiProperty({ example: '+201012345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'الكود لازم يكون 6 أرقام' })
  code: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rate limit: 3 محاولات كل 10 دقايق لكل IP
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('send-otp')
  @ApiOperation({ summary: 'إرسال OTP على رقم التليفون' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  // Rate limit: 5 محاولات كل دقيقة
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  @ApiOperation({ summary: 'التحقق من الكود واستلام الـ JWT' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }
}
