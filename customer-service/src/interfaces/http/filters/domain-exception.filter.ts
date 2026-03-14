import {ExceptionFilter,Catch,ArgumentsHost,HttpStatus} from '@nestjs/common';
import { Response } from 'express';
import {DomainError,CustomerProfileAlreadyExistsError,CustomerProfileNotFoundError,AddressNotFoundError,AddressOwnershipError} from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (
      exception instanceof CustomerProfileNotFoundError ||
      exception instanceof AddressNotFoundError
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof CustomerProfileAlreadyExistsError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof AddressOwnershipError) {
      status = HttpStatus.FORBIDDEN;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
