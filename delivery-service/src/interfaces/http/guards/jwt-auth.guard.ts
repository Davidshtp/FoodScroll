import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request._internalRequest) {
      request.user = {
        id: request.headers['x-user-id'],
        role: request.headers['x-user-role'] || 'DELIVERY',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
