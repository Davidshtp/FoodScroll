import {Injectable,NestInterceptor,ExecutionContext,CallHandler} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import { HEADER_CORRELATION_ID } from '../../config/constants';

/**
 * Genera (o reutiliza) un correlation-id por cada request.
 * Lo adjunta al request, a los headers de respuesta y queda disponible
 * para que el HttpClientService lo propague a los microservicios.
 */
@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const correlationId =
      req.headers[HEADER_CORRELATION_ID] || randomUUID();

    // Adjuntar al request para uso downstream
    req.headers[HEADER_CORRELATION_ID] = correlationId;
    req.correlationId = correlationId;

    // Incluir en la respuesta para trazabilidad end-to-end
    res.setHeader(HEADER_CORRELATION_ID, correlationId);

    return next.handle();
  }
}
