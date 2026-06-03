import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleOAuthPort, GoogleUserInfo } from '../../application/ports/google-oauth.port';
import { GoogleAuthError } from '../../domain/errors/domain.errors';
import { GOOGLE_CLIENT_ID } from '../config/constants';

@Injectable()
export class GoogleOAuthAdapter implements GoogleOAuthPort {
  private readonly logger = new Logger(GoogleOAuthAdapter.name);
  private readonly client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.client = new OAuth2Client();
  }

  async verifyIdToken(idToken: string, clientId: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new GoogleAuthError('El token de Google no contiene información');
      }

      if (!payload.email) {
        throw new GoogleAuthError('El token de Google no contiene un email');
      }

      return {
        googleId: payload.sub || '',
        email: payload.email,
        emailVerified: payload.email_verified || false,
        name: payload.name || '',
        givenName: payload.given_name || '',
        familyName: payload.family_name || '',
        picture: payload.picture || '',
      };
    } catch (error) {
      this.logger.error(`Error verificando token de Google: ${(error as Error).message}`);

      if (error instanceof GoogleAuthError) {
        throw error;
      }

      throw new GoogleAuthError('Token de Google inválido o expirado');
    }
  }
}
