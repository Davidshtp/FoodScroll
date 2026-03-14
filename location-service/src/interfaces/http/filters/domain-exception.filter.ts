import {ExceptionFilter,Catch,ArgumentsHost,HttpStatus} from '@nestjs/common';
import {Response} from 'express';
import {DomainError,DepartmentNotFoundError,CityNotFoundError,DuplicateDepartmentError} from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (
      exception instanceof DepartmentNotFoundError ||
      exception instanceof CityNotFoundError
    ) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof DuplicateDepartmentError) {
      status = HttpStatus.CONFLICT;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
