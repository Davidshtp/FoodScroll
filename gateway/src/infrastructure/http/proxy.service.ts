import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { HttpClientService, ServiceResponse } from './http-client.service';

interface ProxyOptions {
  method: import('axios').Method;
  service: string;
  path: string;
  body?: any;
  query?: Record<string, any>;
  headers?: Record<string, string>;
}

@Injectable()
export class ProxyService {
  constructor(private readonly httpClient: HttpClientService) {}

  /**
   * Proxy para endpoints públicos (sin JWT).
   */
  forwardPublic<T = any>(
    req: Request,
    options: ProxyOptions & { cookies?: string },
  ): Promise<ServiceResponse<T>> {
    return this.httpClient.forward<T>({
      method: options.method,
      service: options.service,
      path: options.path,
      body: options.body,
      query: options.query,
      headers: options.headers,
      cookies: options.cookies,
      correlationId: (req as any).correlationId,
    });
  }

  /**
   * Proxy para endpoints protegidos (requieren JWT y usuario actual).
   */
  forwardAuthenticated<T = any>(
    req: Request,
    user: { id: string; role: string } | any,
    options: ProxyOptions & { cookies?: string },
  ): Promise<ServiceResponse<T>> {
    const authorization = req.headers.authorization;

    return this.httpClient.forward<T>({
      method: options.method,
      service: options.service,
      path: options.path,
      body: options.body,
      query: options.query,
      headers: options.headers,
      cookies: options.cookies,
      correlationId: (req as any).correlationId,
      user,
      authorization,
    });
  }
}
