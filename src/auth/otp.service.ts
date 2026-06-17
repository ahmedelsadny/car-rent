import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';
import { randomInt } from 'crypto';

@Injectable()
export class OtpService {
  // 5 دقايق
  private readonly OTP_TTL = 300;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  generate(): string {
    // ── Test Account ──
    // لو الـ phone هو رقم الـ test → كود ثابت دايماً
    // لو بيئة development → كود ثابت لكل الأرقام
    if (this.config.get('NODE_ENV') === 'development') {
      return this.config.get('TEST_OTP', '111111');
    }
    // randomInt من crypto — cryptographically secure (أأمن من Math.random)
    return randomInt(100000, 999999).toString();
  }

  async store(phone: string, code: string): Promise<void> {
    // في الـ development نـ log بس (مش بنحتاج Redis)
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`[OTP Store Mock] Saved OTP ${code} for phone ${phone}`);
      return;
    }

    // ── Test Account في Production ──
    // الرقم الخاص بالـ testing بيحصل على كود ثابت محدد في الـ env
    if (this.isTestPhone(phone)) {
      console.log(`[OTP Test Account] phone=${phone} code=${this.config.get('TEST_OTP', '111111')}`);
      // مش بنحفظ في Redis لأن الـ verify هيكون خاص بيه
      return;
    }

    await this.redis.getClient().setex(`otp:${phone}`, this.OTP_TTL, code);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    // في الـ development → كل الأرقام تقبل الـ TEST_OTP
    if (this.config.get('NODE_ENV') === 'development') {
      return code === this.config.get('TEST_OTP', '111111');
    }

    // ── Test Account في Production ──
    // بيقبل الـ TEST_OTP فقط بدون Redis
    if (this.isTestPhone(phone)) {
      return code === this.config.get('TEST_OTP', '111111');
    }

    const stored = await this.redis.getClient().get(`otp:${phone}`);
    if (!stored || stored !== code) return false;

    // امسح الكود بعد ما يتحقق منه (منع إعادة الاستخدام)
    await this.redis.getClient().del(`otp:${phone}`);
    return true;
  }

  // ── تحقق إن الرقم هو رقم الـ test ──
  private isTestPhone(phone: string): boolean {
    const testPhone = this.config.get<string>('TEST_PHONE');
    return !!testPhone && phone === testPhone;
  }
}

