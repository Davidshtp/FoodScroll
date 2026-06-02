import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IsActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.isActive) {
      throw new ForbiddenException(
        'Debes completar tu perfil para realizar esta acción',
      );
    }

    return true;
  }
}
