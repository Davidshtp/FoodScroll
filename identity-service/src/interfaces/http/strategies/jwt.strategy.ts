import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {
    const secret = config.get<string>('JWT_SECRET_KEY');
    if (!secret) {
      throw new Error('JWT_SECRET_KEY is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Rechazar refresh tokens — solo access tokens son válidos para autenticación
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used for authentication');
    }

    // payload = { sub, role, client, tokenVersion }
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Token versioning: ensure token's version matches user's current tokenVersion
    const tokenVersionFromToken = payload.tokenVersion;
    const userTokenVersion = user.tokenVersion ?? 0;
    if (tokenVersionFromToken === undefined || tokenVersionFromToken !== userTokenVersion) {
      throw new UnauthorizedException('Token revoked or invalid');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      client: payload.client,
      appStatus: user.appStatus,
    };
  }
}
