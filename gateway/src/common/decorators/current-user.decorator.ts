import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario del request (adjuntado por JwtAuthGuard).
 * Uso:  @CurrentUser() user         → todo el objeto user
 *       @CurrentUser('id') userId   → solo la propiedad "id"
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
