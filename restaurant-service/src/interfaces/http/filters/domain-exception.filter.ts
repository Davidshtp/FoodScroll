import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  RestaurantAlreadyExistsError,
  RestaurantNotFoundError,
  RestaurantAddressNotFoundError,
  DuplicateDayOfWeekError,
} from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof RestaurantNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof RestaurantAddressNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof RestaurantAlreadyExistsError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof DuplicateDayOfWeekError) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
