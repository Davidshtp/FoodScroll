import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  PublicationNotFoundError,
  InvalidPublicationDataError,
} from '../../../domain/errors/domain.errors';
import { HEADER_CORRELATION_ID } from '../../../infrastructure/config/constants';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof PublicationNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof InvalidPublicationDataError) {
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
      correlationId:
        (request.headers[HEADER_CORRELATION_ID] as string) || '-',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
