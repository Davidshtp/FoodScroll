import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { ServiceAuthService } from '../security/service-auth.service';
import { HEADER_CORRELATION_ID, HEADER_USER_ID, HEADER_USER_ROLE, } from '../../config/constants';

// ───── Interfaces ─────
export interface ServiceResponse<T = any> {
  data: T;
  status: number;
  setCookieHeaders?: string[];
}

export interface ForwardOptions {
  method: Method;
  service: string;
  path: string;
  body?: any;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  cookies?: string;
  correlationId?: string;
  user?: { id: string; role: string };
  authorization?: string;
}


@Injectable()
export class HttpClientService {
  private readonly logger = new Logger('HttpClient');
  private readonly timeout: number;
  private readonly retries: number;
  private readonly serviceUrls: Record<string, string>;

  constructor(
    private configService: ConfigService,
    private serviceAuth: ServiceAuthService,
  ) {
    this.timeout = this.configService.get<number>('HTTP_TIMEOUT') || 5000;
    this.retries = this.configService.get<number>('HTTP_RETRIES') || 2;

    this.serviceUrls = {
      IDENTITY: this.configService.get<string>('IDENTITY_SERVICE_URL') || 'http://localhost:5560',
      CUSTOMER: this.configService.get<string>('CUSTOMER_SERVICE_URL') || 'http://localhost:5561',
      LOCATION: this.configService.get<string>('LOCATION_SERVICE_URL') || 'http://localhost:5562',

    };
  }

  /**
   * Reenvía una petición a un microservicio.
   *
   * @returns ServiceResponse con data, status y cookies si las hay
   * @throws HttpException con el error del microservicio o 503 si no responde
   */
  async forward<T = any>(options: ForwardOptions): Promise<ServiceResponse<T>> {
    const baseUrl = this.serviceUrls[options.service];
    if (!baseUrl) {
      throw new HttpException(
        `Servicio desconocido: ${options.service}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = `${baseUrl}${options.path}`;

    // ── Construir headers internos ──
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.serviceAuth.getServiceHeaders(),
      ...(options.correlationId && {
        [HEADER_CORRELATION_ID]: options.correlationId,
      }),
      ...(options.user?.id && { [HEADER_USER_ID]: options.user.id }),
      ...(options.user?.role && { [HEADER_USER_ROLE]: options.user.role }),
      ...(options.authorization && { Authorization: options.authorization }),
      ...(options.cookies && { Cookie: options.cookies }),
      ...(options.headers || {}),
    };

    const config: AxiosRequestConfig = {
      method: options.method,
      url,
      data: options.body,
      params: options.query,
      headers,
      timeout: this.timeout,
      validateStatus: () => true,
    };

    let lastError: any;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        this.logger.debug(
          `[${options.correlationId || '-'}] → ${options.method} ${url} (intento ${attempt + 1})`,
        );

        const response = await axios(config);

        this.logger.debug(
          `[${options.correlationId || '-'}] ← ${response.status} ${options.method} ${url}`,
        );

        // Si el microservicio respondió con error, propagarlo al cliente
        if (response.status >= 400) {
          throw new HttpException(
            response.data || 'Error del microservicio',
            response.status,
          );
        }

        return {
          data: response.data as T,
          status: response.status,
          setCookieHeaders: response.headers['set-cookie'] as
            | string[]
            | undefined,
        };
      } catch (error) {
        // Errores HTTP del microservicio → no reintentar
        if (error instanceof HttpException) {
          throw error;
        }

        lastError = error;
        this.logger.warn(
          `[${options.correlationId || '-'}] Intento ${attempt + 1} falló para ${options.method} ${url}: ${error.message}`,
        );

        // Esperar antes de reintentar (backoff lineal)
        if (attempt < this.retries) {
          await this.delay(500 * (attempt + 1));
        }
      }
    }

    this.logger.error(
      `[${lastError?.correlationId || '-'}] Todos los intentos fallaron para ${options.method} ${url}`,
    );

    throw new HttpException(
      'Servicio no disponible',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
