import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

// الاستخدام: @CurrentUser() user: User
// أو:        @CurrentUser('id') userId: string
export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    return field ? user?.[field] : user;
  },
);
