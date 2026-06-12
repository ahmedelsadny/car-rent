import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const isProduction = this.config.get('NODE_ENV') === 'production';
    const password = this.config.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      // Password — مطلوب في production
      ...(password && { password }),
      // TLS — يُفعَّل تلقائياً في production
      ...(isProduction && { tls: {} }),
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected ✅');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }
}
