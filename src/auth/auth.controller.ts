import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString, Matches, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SendOtpDto {
  @ApiProperty({ example: '+201012345678' })
  @IsString()
  @Matches(/^\+20[0-9]{10}$/, { message: 'رقم تليفون مصري غير صحيح' })
  phone: string;
}

class VerifyOtpDto {
  @ApiProperty({ example: '+201012345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'الكود لازم يكون 6 أرقام' })
  code?: string;

  @ApiProperty({ example: 'firebase-id-token-here', required: false })
  @IsOptional()
  @IsString()
  firebaseToken?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rate limit: 3 محاولات كل 10 دقايق لكل IP
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('send-otp')
  @ApiOperation({ summary: 'إرسال OTP على رقم التليفون (متوافق مع النظام القديم)' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  // ليتوافق تماماً مع مخطط التتابع المرسل (clientApis.login)
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @Post('login')
  @ApiOperation({ summary: 'استدعاء تهيئة حساب تسجيل الدخول' })
  login(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  // Rate limit: 5 محاولات كل دقيقة
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  @ApiOperation({ summary: 'التحقق واستلام الـ JWT (متوافق مع النظام القديم)' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.firebaseToken);
  }

  // ليتوافق تماماً مع مخطط التتابع المرسل (clientApis.confirmLogin)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('confirm-login')
  @ApiOperation({ summary: 'التحقق من توكن Firebase واستلام الـ JWT للمصادقة' })
  confirmLogin(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.firebaseToken);
  }
}
