/**
 * Port: TokenGenerator
 * Define el contrato para la generación y verificación de tokens JWT
 */
export interface TokenPayload {
  sub: string;
  role: string;
  client: string;
  tokenVersion: number;
  appStatus: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  client: string;
}

export interface TokenGenerator {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: RefreshTokenPayload): string;
  verifyAccessToken(token: string): TokenPayload | null;
  verifyRefreshToken(token: string): RefreshTokenPayload | null;
}

export const TOKEN_GENERATOR = Symbol('TokenGenerator');
