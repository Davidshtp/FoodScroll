import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HEADER_SERVICE_SECRET } from '../../../config/constants';

@Injectable()
export class ServiceSecretGuard implements CanActivate {
  private readonly logger = new Logger('ServiceSecretGuard');
  private readonly serviceSecret: string;

  constructor(private configService: ConfigService) {
    this.serviceSecret =
      this.configService.get<string>('SERVICE_SECRET') ||
      'default-service-secret';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers[HEADER_SERVICE_SECRET];

    if (!secret) {
      return true;
    }

    if (secret !== this.serviceSecret) {
      this.logger.warn(
        `Petición bloqueada (secret inválido): ${request.method} ${request.url} desde ${request.ip}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: credenciales de servicio inválidas',
      );
    }

    request._internalRequest = true;
    return true;
  }
}
