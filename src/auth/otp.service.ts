import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class OtpService {
  private redis: Redis;
  private readonly OTP_TTL = 300; // 5 دقايق

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
    });
  }

  generate(): string {
    // كود 6 أرقام
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async store(phone: string, code: string): Promise<void> {
    await this.redis.setex(`otp:${phone}`, this.OTP_TTL, code);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);
    if (!stored || stored !== code) return false;

    // امسح الكود بعد ما يتحقق منه
    await this.redis.del(`otp:${phone}`);
    return true;
  }

  async send(phone: string, code: string): Promise<void> {
    // في الـ development بنـ log الكود بس
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
