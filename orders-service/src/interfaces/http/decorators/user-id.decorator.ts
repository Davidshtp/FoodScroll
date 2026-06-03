import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

export interface UserIdPayload {
  id: string;
  role: string;
  client: string;
  appStatus: string | null;
}

/**
 * Returns authenticated user id from JWT.
 * If `x-user-id` is provided, it must match JWT user id.
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const logger = new Logger('UserIdDecorator');
    const request = ctx.switchToHttp().getRequest();

    const headerValue = request.headers['x-user-id'] as
      | string
      | string[]
      | undefined;
    const headerUserId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    const jwtUser = request.user as UserIdPayload | undefined;
    const jwtUserId = jwtUser?.id;

    if (!jwtUserId) {
      throw new UnauthorizedException('Invalid or missing token');
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