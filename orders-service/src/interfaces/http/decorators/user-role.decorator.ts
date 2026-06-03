import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const UserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const role = request.user?.role;

    if (!role) {
      throw new UnauthorizedException('Invalid token or missing role');
    }

    return role;
  },
);
