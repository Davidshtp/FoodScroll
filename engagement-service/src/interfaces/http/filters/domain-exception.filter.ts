import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, LikeNotFoundError, FollowerNotFoundError, CommentNotFoundError, CommentOwnershipError } from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof LikeNotFoundError || exception instanceof FollowerNotFoundError || exception instanceof CommentNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof CommentOwnershipError) {
      status = HttpStatus.FORBIDDEN;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
