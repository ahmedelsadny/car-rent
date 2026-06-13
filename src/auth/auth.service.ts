import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { OtpService } from './otp.service';
import * as admin from 'firebase-admin';

export type UserRole = 'CUSTOMER' | 'OWNER';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private otp: OtpService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.get('FIREBASE_PROJECT_ID') || process.env.FIREBASE_PROJECT_ID,
          clientEmail: this.config.get('FIREBASE_CLIENT_EMAIL') || process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (this.config.get('FIREBASE_PRIVATE_KEY') || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  // ── Step 1: العميل يدخل رقم تليفونه ──
  async sendOtp(phone: string): Promise<{ message: string }> {
    // لا يتم إرسال SMS حقيقي من السيرفر لأن Firebase يتولى ذلك على الكلاينت
    console.log(`[OTP Init] Phone check for: ${phone}. Handled by Firebase on client.`);
    return { message: 'OTP verification initialized by client via Firebase.' };
  }

  // ── Step 2: يتحقق من الكود أو الـ Firebase Token ──
  async verifyOtp(
    phone?: string,
    code?: string,
    firebaseToken?: string,
  ): Promise<{
    access_token: string;
    is_new: boolean;
    role: UserRole;
    ownerId: string | null;
  }> {
    let verifiedPhone: string;

    if (firebaseToken) {
      // ── التحقق من توكن Firebase (حالة التشغيل الفعلية) ──
      try {
        // تسهيل للاختبار في التطوير بـ mock token
        if (
          this.config.get('NODE_ENV') === 'development' &&
          firebaseToken === 'mock-firebase-token'
        ) {
          verifiedPhone = phone || this.config.get('TEST_PHONE') || '+201222222222';
        } else {
          const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
          const fbPhone = decodedToken.phone_number;
          if (!fbPhone) {
            throw new UnauthorizedException('توقيع Firebase لا يحتوي على رقم هاتف');
          }
          verifiedPhone = fbPhone;
        }
      } catch (err) {
        throw new UnauthorizedException(`فشل التحقق من توكن Firebase: ${err.message}`);
      }
    } else {
      // ── التحقق التقليدي بـ OTP (للبيئة التجريبية / التوافق الخلفي) ──
      if (!phone || !code) {
        throw new UnauthorizedException('يجب إرسال الـ Firebase ID Token أو رقم الهاتف والكود التجريبي');
      }
      const isValid = await this.otp.verify(phone, code);
      if (!isValid) {
        throw new UnauthorizedException('كود OTP غير صحيح أو منتهي الصلاحية');
      }
      verifiedPhone = phone;
    }

    // جيب أو أنشئ اليوزر بالرقم المتحقق منه
    let user = await this.prisma.user.findUnique({
      where: { phone: verifiedPhone },
      include: { owner: true },
    });
    const isNew = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone: verifiedPhone, name: '' },
        include: { owner: true },
      });
    }

    const role: UserRole = user.owner ? 'OWNER' : 'CUSTOMER';
    const ownerId = user.owner?.id ?? null;

    const token = this.jwt.sign({
      sub: user.id,
      phone: user.phone,
    });

    return {
      access_token: token,
      is_new: isNew,
      role,
      ownerId,
    };
  }
}
