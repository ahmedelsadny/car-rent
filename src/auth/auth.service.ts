import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { OtpService } from './otp.service';

export type UserRole = 'CUSTOMER' | 'OWNER';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private otp: OtpService,
  ) {}

  // ── Step 1: العميل يدخل رقم تليفونه ──
  async sendOtp(phone: string): Promise<{ message: string }> {
    const code = this.otp.generate();

    // حفظ الكود في Redis لمدة 5 دقايق
    await this.otp.store(phone, code);

    // إرسال SMS (Vonage)
    await this.otp.send(phone, code);

    return { message: 'OTP sent successfully' };
  }

  // ── Step 2: يتحقق من الكود ──
  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{
    access_token: string;
    is_new: boolean;
    role: UserRole;
    ownerId: string | null;
  }> {
    const isValid = await this.otp.verify(phone, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // جيب أو أنشئ اليوزر
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { owner: true },
    });
    const isNew = !user;

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, name: '' },
        include: { owner: true },
      });
    }

    // حدد الدور بناءً على وجود معرض
    const role: UserRole = user.owner ? 'OWNER' : 'CUSTOMER';
    const ownerId = user.owner?.id ?? null;

    const token = this.jwt.sign({
      sub: user.id,
      phone: user.phone,
      role,
    });

    return {
      access_token: token,
      is_new: isNew,
      role,
      ownerId,
    };
  }
}
