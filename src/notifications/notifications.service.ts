import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as admin from 'firebase-admin';

interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

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
    // 1. حفظ في DB
    await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      },
    });

    // 2. جيب FCM tokens اليوزر (محتاج تضيف device_tokens table)
    // const tokens = await this.getDeviceTokens(userId);
    // if (tokens.length) await this.sendPush(tokens, payload);
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
  // ملاحظة: محتاج تضيف device_tokens table في الـ schema
  async registerDeviceToken(userId: string, token: string, platform: string) {
    // TODO: save token in device_tokens table
    // await this.prisma.deviceToken.upsert({
    //   where: { token },
    //   update: { userId, platform, updatedAt: new Date() },
    //   create: { userId, token, platform },
    // });
    return { message: 'Device token registered' };
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
}
