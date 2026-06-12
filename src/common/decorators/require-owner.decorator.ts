import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OwnerGuard } from '../guards/owner.guard';

// الاستخدام: @RequireOwner() على أي endpoint خاص بالمعارض
export const RequireOwner = () =>
  applyDecorators(UseGuards(JwtAuthGuard, OwnerGuard));
