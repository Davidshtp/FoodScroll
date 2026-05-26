import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as FormDataType from 'form-data';
import {
  RuntLicenseVerificationPort,
  LicenseVerifyFullAutoResult,
  LicenseVerifyResult,
} from '../../application/ports/runt-license-verification.port';
import {
  SERVICE_SECRET,
  HEADER_SERVICE_SECRET,
  LICENSE_VERIFICATION_SERVICE_URL,
} from '../../config/constants';
import { LicenseVerificationError } from '../../domain/errors/domain.errors';

const FormData = FormDataType;

@Injectable()
export class RuntLicenseVerificationAdapter implements RuntLicenseVerificationPort {
  private readonly logger = new Logger(RuntLicenseVerificationAdapter.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>(LICENSE_VERIFICATION_SERVICE_URL) ||
      'http://localhost:5592';
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 180000,
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
    documentType?: string;
    documentNumber?: string;
    maxAttempts?: number;
    retryDelayMs?: number;
    debug?: boolean;
    accessToken?: string;
  }): Promise<LicenseVerifyFullAutoResult> {
    const hasImage = params.imageBuffer && params.imageBuffer.length > 0;
    const hasOverrides = !!(params.documentType && params.documentNumber);

    if (!hasImage && !hasOverrides) {
      return {
        error: true,
        code: 'INVALID_INPUT',
        message: 'Imagen o datos (documentType+documentNumber) requeridos',
        needsManualInput: true,
        manualStep: 'document_data',
      };
    }

    const formData = new FormData();
    if (hasImage) {
      formData.append('image', params.imageBuffer!, {
        filename: 'license.jpg',
        contentType: 'image/jpeg',
      });
    }
    if (params.documentType) {
      formData.append('documentType', params.documentType);
    }
    if (params.documentNumber) {
      formData.append('documentNumber', params.documentNumber);
    }
    formData.append('maxAttempts', String(params.maxAttempts || 5));
    formData.append('retryDelayMs', String(params.retryDelayMs || 500));
    formData.append('debug', String(params.debug || false));

    try {
      const response = await this.http.post(
        '/runt/verify-full-auto-licencia',
        formData,
        {
          headers: {
            ...this.getHeaders(params.accessToken),
            ...formData.getHeaders(),
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error verifyFullAuto license',
        error.response?.data || error.message,
      );

      if (error.response?.data) {
        return error.response.data;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new LicenseVerificationError(
          'Tiempo de espera excedido con el servicio de licencias RUNT',
          'RUNT_TIMEOUT',
        );
      }

      throw new LicenseVerificationError(
        error.message || 'Error de conexión con servicio de licencias RUNT',
        'LICENSE_ADAPTER_ERROR',
      );
    }
  }

  async verifyManual(params: {
    sessionId: string;
    documentType: string;
    documentNumber: string;
    captchaText: string;
    accessToken?: string;
  }): Promise<LicenseVerifyResult> {
    try {
      const response = await this.http.post('/runt/verify-licencia', params, {
        headers: this.getHeaders(params.accessToken),
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error verifyManual license',
        error.response?.data || error.message,
      );

      if (error.response?.data) {
        return error.response.data;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new LicenseVerificationError(
          'Tiempo de espera excedido con el servicio de licencias RUNT',
          'RUNT_TIMEOUT',
        );
      }

      throw new LicenseVerificationError(
        error.message || 'Error de conexión con servicio de licencias RUNT',
        'LICENSE_ADAPTER_ERROR',
      );
    }
  }
}
