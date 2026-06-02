import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IS_PUBLIC_KEY, IDENTITY_SERVICE_URL, SERVICE_SECRET, HEADER_SERVICE_SECRET } from '../../config/constants';

interface IdentityUserResponse {
  id: string;
  tokenVersion: number;
  appStatus: string | null;
  isActive: boolean;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly identityBaseUrl: string;
  private readonly serviceSecret: string;

  constructor(private reflector: Reflector, private configService: ConfigService) {
    super();
    this.identityBaseUrl = this.configService.get<string>(IDENTITY_SERVICE_URL) || 'http://127.0.0.1:5560';
    this.serviceSecret = this.configService.get<string>(SERVICE_SECRET) || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const result = await super.canActivate(context) as boolean;
    if (!result) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Token inválido o no proporcionado');
    }

    await this.validateTokenVersion(user, context);
    return true;
  }

  private async validateTokenVersion(user: any, context: ExecutionContext) {
    const tokenVersionFromToken = user?.tokenVersion;
    if (tokenVersionFromToken === undefined) {
      throw new UnauthorizedException('Token missing tokenVersion');
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    try {
      const response = await axios.get<IdentityUserResponse>(
        `${this.identityBaseUrl}/auth/me`,
        {
          headers: {
            [HEADER_SERVICE_SECRET]: this.serviceSecret,
            Authorization: authHeader,
          },
          timeout: 3000,
        },
      );

      const currentTokenVersion = response.data?.tokenVersion;
      if (currentTokenVersion === undefined || currentTokenVersion !== tokenVersionFromToken) {
        this.logger.warn(
          `Token revoked: tokenVersion=${tokenVersionFromToken}, currentTokenVersion=${currentTokenVersion}`,
        );
        throw new UnauthorizedException('Token revoked or expired');
      }

      request.user.isActive = response.data?.isActive ?? false;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Token revoked or expired');
      }
      this.logger.error(`Failed to validate tokenVersion: ${error.message}`);
      throw new UnauthorizedException('Unable to validate token');
    }
  }
}
