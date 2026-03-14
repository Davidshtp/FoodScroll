import {Injectable,NestInterceptor,ExecutionContext,CallHandler,Logger} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { HEADER_CORRELATION_ID } from '../../../infrastructure/config/constants';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const correlationId = req.headers[HEADER_CORRELATION_ID] || '-';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = Date.now() - now;
          this.logger.log(
            `[${correlationId}] ${method} ${originalUrl} → ${res.statusCode} (${duration}ms)`,
          );
        },
        error: (err) => {
          const duration = Date.now() - now;
          const status = err?.status || err?.getStatus?.() || 500;
          this.logger.warn(
            `[${correlationId}] ${method} ${originalUrl} → ${status} (${duration}ms)`,
          );
        },
      }),
    );
  }
}
