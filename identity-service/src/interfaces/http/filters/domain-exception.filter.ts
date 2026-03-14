import {ExceptionFilter,Catch,ArgumentsHost,HttpStatus} from '@nestjs/common';
import { Response } from 'express';
import {DomainError,InvalidCredentialsError,UserAlreadyExistsError,UserNotFoundError,InvalidCodeError,CodeExpiredError,EmailNotVerifiedError,EmailAlreadyVerifiedError,InvalidRefreshTokenError,AccessDeniedError,TokenRevokedError} from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof InvalidCredentialsError) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof UserNotFoundError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof UserAlreadyExistsError) {
      status = HttpStatus.CONFLICT;
    } else if (exception instanceof InvalidCodeError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof CodeExpiredError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof EmailNotVerifiedError) {
      status = HttpStatus.FORBIDDEN;
    } else if (exception instanceof EmailAlreadyVerifiedError) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof InvalidRefreshTokenError) {
      status = HttpStatus.UNAUTHORIZED;
    } else if (exception instanceof AccessDeniedError) {
      status = HttpStatus.FORBIDDEN;
    } else if (exception instanceof TokenRevokedError) {
      status = HttpStatus.UNAUTHORIZED;
    }

    response.status(status).json({
      success: false,
      error: exception.message,
      errorType: exception.name,
    });
  }
}
