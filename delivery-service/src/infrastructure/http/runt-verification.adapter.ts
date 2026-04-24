import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RuntVerificationPort,
  RuntVerifyFullAutoResult,
  RuntVerifyResult,
} from '../../application/ports/runt-verification.port';
import {
  SERVICE_SECRET,
  HEADER_SERVICE_SECRET,
  RUNT_VERIFICATION_SERVICE_URL,
} from '../../config/constants';
import {
  RuntVerificationError,
  VehicleNotFoundError,
} from '../../domain/errors/domain.errors';

@Injectable()
export class RuntVerificationAdapter implements RuntVerificationPort {
  private readonly logger = new Logger(RuntVerificationAdapter.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>(RUNT_VERIFICATION_SERVICE_URL) ||
      'http://localhost:5591';
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 180000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private getHeaders(accessToken?: string) {
    const serviceSecret = this.configService.get<string>(SERVICE_SECRET);
    const headers: Record<string, string> = {
      [HEADER_SERVICE_SECRET]: serviceSecret || '',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }

  async verifyFullAuto(params: {
    imageBuffer?: Buffer;
    plate?: string;
    documentType?: string;
    documentNumber?: string;
    maxAttempts?: number;
    retryDelayMs?: number;
    debug?: boolean;
    accessToken?: string;
  }): Promise<RuntVerifyFullAutoResult> {
    const hasImage = params.imageBuffer && params.imageBuffer.length > 0;
    const hasOverrides = !!(
      params.plate &&
      params.documentType &&
      params.documentNumber
    );

    if (!hasImage && !hasOverrides) {
      return {
        error: true,
        code: 'INVALID_INPUT',
        message:
          'Imagen o datos (plate+documentType+documentNumber) requeridos',
        needsManualInput: true,
        manualStep: 'license_data',
      };
    }

    const payload: Record<string, any> = {
      maxAttempts: params.maxAttempts || 5,
      retryDelayMs: params.retryDelayMs || 500,
      debug: params.debug || false,
    };

    if (hasImage) {
      payload.image = params.imageBuffer!.toString('base64');
    }
    if (params.plate) payload.plate = params.plate;
    if (params.documentType) payload.documentType = params.documentType;
    if (params.documentNumber) payload.documentNumber = params.documentNumber;

    try {
      const response = await this.http.post('/runt/verify-full-auto', payload, {
        headers: this.getHeaders(params.accessToken),
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error verifyFullAuto',
        error.response?.data || error.message,
      );

      if (error.response?.data) {
        const data = error.response.data;
        if (data.code === 'VEHICLE_NOT_FOUND') {
          throw new VehicleNotFoundError(params.plate || 'unknown');
        }
        if (data.code === 'INVALID_INPUT') {
          throw new RuntVerificationError(
            data.message || 'Datos inválidos',
            'INVALID_INPUT',
          );
        }
        return data;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new RuntVerificationError(
          'Tiempo de espera excedido con el servicio RUNT',
          'RUNT_TIMEOUT',
        );
      }

      throw new RuntVerificationError(
        error.message || 'Error de conexión con servicio RUNT',
        'RUNT_ADAPTER_ERROR',
      );
    }
  }

  async verifyManual(params: {
    sessionId: string;
    plate: string;
    documentType: string;
    documentNumber: string;
    captchaText: string;
    accessToken?: string;
  }): Promise<RuntVerifyResult> {
    try {
      const response = await this.http.post('/runt/verify-manual', params, {
        headers: this.getHeaders(params.accessToken),
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error verifyManual',
        error.response?.data || error.message,
      );

      if (error.response?.data) {
        const data = error.response.data;
        if (data.code === 'VEHICLE_NOT_FOUND') {
          throw new VehicleNotFoundError(params.plate);
        }
        throw new RuntVerificationError(
          data.message || 'Error en verificación RUNT',
          data.code || 'RUNT_VERIFICATION_ERROR',
        );
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new RuntVerificationError(
          'Tiempo de espera excedido con el servicio RUNT',
          'RUNT_TIMEOUT',
        );
      }

      throw new RuntVerificationError(
        error.message || 'Error de conexión con servicio RUNT',
        'RUNT_ADAPTER_ERROR',
      );
    }
  }
}
