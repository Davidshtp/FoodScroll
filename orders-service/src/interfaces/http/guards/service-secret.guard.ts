import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET } from '../../../infrastructure/config/constants';

@Injectable()
export class ServiceSecretGuard implements CanActivate {
  private readonly logger = new Logger('ServiceSecretGuard');
  private readonly serviceSecret: string;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>(SERVICE_SECRET);
    if (!secret) {
      throw new Error('SERVICE_SECRET not configured');
    }
    this.serviceSecret = secret;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers[HEADER_SERVICE_SECRET];

    if (!secret) {
      this.logger.warn(
        `Request blocked (missing service-secret): ${request.method} ${request.url} desde ${request.ip}`,
      );
      throw new ForbiddenException(
        'Access denied: internal API only',
      );
    }

    if (secret !== this.serviceSecret) {
      this.logger.warn(
        `Request blocked (invalid secret): ${request.method} ${request.url} desde ${request.ip}`,
      );
      throw new ForbiddenException(
        'Access denied: invalid service credentials',
      );
    }

    return true;
  }
}
