import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HEADER_USER_ID } from '../../../config/constants';

export interface CurrentUserPayload {
  id: string;
  role: string;
  client: string;
  appStatus: string | null;
  accessToken?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | CurrentUserPayload => {
    const logger = new Logger('CurrentUserDecorator');
    const request = ctx.switchToHttp().getRequest();

    const headerValue = request.headers[HEADER_USER_ID] as
      | string
      | string[]
      | undefined;
    const headerUserId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    const jwtUser = request.user as CurrentUserPayload | undefined;
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

    const authHeader = request.headers.authorization;
    let accessToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    const payload: CurrentUserPayload = {
      id: jwtUserId,
      role: jwtUser?.role ?? '',
      client: jwtUser?.client ?? '',
      appStatus: jwtUser?.appStatus ?? null,
      accessToken,
    };

    if (data === 'id') {
      return jwtUserId;
    }

    return payload;
  },
);
