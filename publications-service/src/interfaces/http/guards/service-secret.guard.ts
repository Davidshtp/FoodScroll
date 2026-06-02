import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HEADER_SERVICE_SECRET, SERVICE_SECRET } from '../../../infrastructure/config/constants';

@Injectable()
export class ServiceSecretGuard implements CanActivate {
  private readonly logger = new Logger('ServiceSecretGuard');
  private readonly serviceSecret: string;

  constructor(private configService: ConfigService) {
    this.serviceSecret =
      this.configService.get<string>(SERVICE_SECRET) ||
      'default-service-secret';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers[HEADER_SERVICE_SECRET];

    if (!secret) {
      this.logger.warn(
        `Request blocked (missing service-secret): ${request.method} ${request.url} from ${request.ip}`,
      );
      throw new ForbiddenException(
        'Access denied: this API only accepts internal requests',
      );
    }

    if (secret !== this.serviceSecret) {
      this.logger.warn(
        `Request blocked (invalid secret): ${request.method} ${request.url} from ${request.ip}`,
      );
      throw new ForbiddenException(
        'Access denied: invalid service credentials',
      );
    }

    return true;
  }
}