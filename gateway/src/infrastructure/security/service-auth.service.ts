import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HEADER_SERVICE_SECRET } from '../../config/constants';


@Injectable()
export class ServiceAuthService {
  private readonly serviceSecret: string;

  constructor(private configService: ConfigService) {
    const value = this.configService.get<string>('SERVICE_SECRET');

    if (!value) {
      throw new Error('SERVICE_SECRET must be configured');
    }

    this.serviceSecret = value;
  }

  /** Headers de autenticación interna para incluir en peticiones a microservicios */
  getServiceHeaders(): Record<string, string> {
    return {
      [HEADER_SERVICE_SECRET]: this.serviceSecret,
    };
  }

  /** Valida un secret entrante (para uso de microservicios) */
  validateSecret(secret: string): boolean {
    return secret === this.serviceSecret;
  }
}
