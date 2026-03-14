import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {TokenGenerator,TokenPayload,RefreshTokenPayload} from '../../application/ports/token-generator.port';

/**
 * JWT Implementation: TokenGenerator
 * Implementación concreta del generador de tokens usando JWT
 */
@Injectable()
export class JwtTokenGenerator implements TokenGenerator {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = this.jwtService.verify(token);
      // Validar que no sea un refresh token
      if (payload.type === 'refresh') return null;
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const payload = this.jwtService.verify(token);
      // Validar que sea un refresh token
      if (payload.type !== 'refresh') return null;
      return payload as RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
