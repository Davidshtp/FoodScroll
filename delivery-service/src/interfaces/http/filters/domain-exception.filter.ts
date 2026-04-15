import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainError,
  DeliveryProfileNotFoundError,
  VehicleNotFoundError,
  DeliveryProfileAlreadyExistsError,
  CaptchaResolutionError,
  RuntNeedsManualLicenseDataError,
  RuntVerificationError,
} from '../../../domain/errors/domain.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let details: any = undefined;

    if (exception instanceof VehicleNotFoundError) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof DeliveryProfileNotFoundError ||
      exception instanceof DeliveryProfileAlreadyExistsError
    ) {
      status = HttpStatus.NOT_FOUND;
      if (exception instanceof DeliveryProfileAlreadyExistsError) {
        status = HttpStatus.CONFLICT;
      }
    } else if (
      exception instanceof CaptchaResolutionError ||
      exception instanceof RuntNeedsManualLicenseDataError
    ) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      try {
        details = JSON.parse(exception.message);
      } catch {
        details = { rawMessage: exception.message };
      }
    } else if (exception instanceof RuntVerificationError) {
      if (exception.code === 'INVALID_INPUT') {
        status = HttpStatus.BAD_REQUEST;
      } else if (
        exception.code === 'RUNT_TIMEOUT' ||
        exception.code === 'RUNT_ADAPTER_ERROR'
      ) {
        status = HttpStatus.BAD_GATEWAY;
      } else {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
      }
      details = { code: exception.code };
    }

    const payload: any = {
      statusCode: status,
      message: exception.message,
      error: exception.code,
    };

    if (details) {
      payload.details = details;
    }

    response.status(status).json(payload);
  }
}
