import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET } from '../../../infrastructure/config/constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ServiceSecretGuard implements CanActivate {
  private readonly logger = new Logger('ServiceSecretGuard');
  private readonly serviceSecret: string;

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    this.serviceSecret =
      this.configService.get<string>(SERVICE_SECRET) ||
      'default-service-secret';
  }

  canActivate(context: ExecutionContext): boolean {
    // Skip public endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const secret = request.headers[HEADER_SERVICE_SECRET];

    if (!secret) {
      this.logger.warn(
        `Petición bloqueada (sin service-secret): ${request.method} ${request.url} desde ${request.ip}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: esta API solo acepta peticiones internas',
      );
    }

    if (secret !== this.serviceSecret) {
      this.logger.warn(
        `Petición bloqueada (secret inválido): ${request.method} ${request.url} desde ${request.ip}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: credenciales de servicio inválidas',
      );
    }

    return true;
  }
}
