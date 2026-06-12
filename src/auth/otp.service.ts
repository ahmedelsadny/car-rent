import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';
import { randomInt } from 'crypto';
import axios from 'axios';

@Injectable()
export class OtpService {
  // 5 دقايق
  private readonly OTP_TTL = 300;

  // بنستخدم RedisService المشترك بدل إنشاء instance جديد (يمنع memory leak)
  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  generate(): string {
    // كود ثابت للتجربة في بيئة التطوير
    if (this.config.get('NODE_ENV') === 'development') {
      return '111111';
    }
    // randomInt من crypto — cryptographically secure (أأمن من Math.random)
    return randomInt(100000, 999999).toString();
  }

  async store(phone: string, code: string): Promise<void> {
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`[OTP Store Mock] Saved OTP ${code} for phone ${phone}`);
      return;
    }
    await this.redis.getClient().setex(`otp:${phone}`, this.OTP_TTL, code);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    if (this.config.get('NODE_ENV') === 'development') {
      return code === '111111';
    }
    const stored = await this.redis.getClient().get(`otp:${phone}`);
    if (!stored || stored !== code) return false;

    // امسح الكود بعد ما يتحقق منه (منع إعادة الاستخدام)
    await this.redis.getClient().del(`otp:${phone}`);
    return true;
  }

  async send(phone: string, code: string): Promise<void> {
    if (this.config.get('NODE_ENV') === 'development') {
      console.log(`[OTP] ${phone}: ${code}`);
      return;
    }

    // Vonage SMS API
    await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: this.config.get('VONAGE_API_KEY'),
      api_secret: this.config.get('VONAGE_API_SECRET'),
      to: phone,
      from: 'CarRent',
      text: `كود التحقق الخاص بك: ${code}\nصالح لمدة 5 دقائق`,
    });
  }
}
