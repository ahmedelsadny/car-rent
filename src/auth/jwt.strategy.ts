import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ignoreExpiration: false هو الـ default — بنكتبه صراحةً للوضوح
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; phone: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { owner: true },
    });

    if (!user) throw new UnauthorizedException();

    // ── Role من DB مش من JWT payload (يمنع Role Confusion) ──
    // لو حد عمل tamper على الـ token → الـ role بيتحسب من الـ DB دايماً
    const role = user.owner ? 'OWNER' : 'CUSTOMER';

    const { owner, ...userWithoutOwner } = user;
    return { ...userWithoutOwner, role };
  }
}
