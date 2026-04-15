import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HEADER_USER_ID } from '../../../config/constants';

export interface UserIdPayload {
  id: string;
  role: string;
  client: string;
  appStatus: string | null;
}

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const logger = new Logger('UserIdDecorator');
    const request = ctx.switchToHttp().getRequest();

    const headerValue = request.headers[HEADER_USER_ID] as
      | string
      | string[]
      | undefined;
    const headerUserId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const jwtUser = request.user as UserIdPayload | undefined;
    const jwtUserId = jwtUser?.id;

    if (!jwtUserId) {
      throw new UnauthorizedException('Token inválido o no proporcionado');
    }

    if (headerUserId && headerUserId !== jwtUserId) {
      logger.warn(
        `Spoofing attempt detected: x-user-id header (${headerUserId}) does not match JWT sub (${jwtUserId})`,
      );
      throw new ForbiddenException(
        'x-user-id header does not match authenticated user',
      );
    }

    return jwtUserId;
  },
);
