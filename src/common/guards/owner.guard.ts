import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.id;

    const owner = await this.prisma.owner.findUnique({
      where: { userId },
    });

    if (!owner) {
      throw new ForbiddenException('Owner account required');
    }

    // حط الـ owner على الـ request عشان نستخدمه في الـ controllers
    request.owner = owner;
    return true;
  }
}
