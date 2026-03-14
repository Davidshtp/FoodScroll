import {ExceptionFilter,Catch,ArgumentsHost,HttpException,HttpStatus,Logger,} from '@nestjs/common';
import { Request, Response } from 'express';
import { HEADER_CORRELATION_ID } from '../../config/constants';

/**
 * Filtro global de excepciones del gateway.
 * Normaliza TODOS los errores a un formato consistente
 * y evita fugas de información interna.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, any>;
        message = res.message || exception.message;
        error = res.error || error;
      }
    }

    const correlationId = request.headers[HEADER_CORRELATION_ID] || '-';

    // Solo loguear errores de servidor (5xx)
    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
