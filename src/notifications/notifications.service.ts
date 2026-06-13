import { CreateNotificationTemplateDto } from './dto/notification-template.dto';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  variables?: Record<string, any>;
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async send(userId: string, payload: NotificationPayload) {
    // 1. ابحث عن قالب في قاعدة البيانات
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { type: payload.type },
    });

    let resolvedTitle = payload.title;
    let resolvedBody = payload.body;

    if (template) {
      const vars = { ...payload.data, ...payload.variables };
      resolvedTitle = this.renderTemplate(template.title, vars);
      resolvedBody = this.renderTemplate(template.body, vars);
    }

    // 2. حفظ في DB
    await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: resolvedTitle,
        body: resolvedBody,
        data: payload.data || {},
      },
    });

    // 3. جيب FCM tokens اليوزر
    const tokens = await this.getDeviceTokens(userId);
    if (tokens.length) {
      try {
        await this.sendPush(tokens, {
          type: payload.type,
          title: resolvedTitle,
          body: resolvedBody,
          data: payload.data,
        });
      } catch (err) {
        console.error('Failed to send push notification via Firebase:', err.message);
      }
    }
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // حفظ device token للـ push notifications
  async registerDeviceToken(userId: string, token: string, platform: string) {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });
    return { message: 'Device token registered successfully' };
  }

  private async getDeviceTokens(userId: string): Promise<string[]> {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return tokens.map(t => t.token);
  }

  private async sendPush(tokens: string[], payload: NotificationPayload) {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: Object.fromEntries(
        Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
      ),
    });
  }

  // ─── إدارة قوالب الإشعارات (Admin only) ──────────────────────────────────

  async getTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { type: 'asc' },
    });
  }

  async getTemplateByType(type: string) {
    return this.prisma.notificationTemplate.findUnique({
      where: { type },
    });
  }

  async upsertTemplate(dto: CreateNotificationTemplateDto) {
    return this.prisma.notificationTemplate.upsert({
      where: { type: dto.type },
      update: {
        title: dto.title,
        body: dto.body,
      },
      create: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
      },
    });
  }

  async deleteTemplate(type: string) {
    await this.prisma.notificationTemplate.delete({
      where: { type },
    });
    return { message: 'تم حذف قالب الإشعار بنجاح' };
  }

  private renderTemplate(template: string, vars: Record<string, any> = {}): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return vars[key] !== undefined ? String(vars[key]) : match;
    });
  }
}
