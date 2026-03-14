import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_SECRET_KEY } from '../../config/constants';

interface JwtPayload {
  sub: string;
  role: string;
  client: string;
  appStatus?: string | null;
  tokenVersion?: number;
  type?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>(JWT_SECRET_KEY);
    if (!secret) {
      throw new Error('JWT_SECRET_KEY is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Rechazar refresh tokens — solo access tokens son válidos para autenticación
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used for authentication');
    }

    if (!payload.sub || !payload.role || !payload.client) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return {
      id: payload.sub,
      role: payload.role,
      client: payload.client,
      appStatus: payload.appStatus ?? null,
    };
  }
}
