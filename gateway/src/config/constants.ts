// ───── Environment variables ─────
export const JWT_SECRET_KEY = 'JWT_SECRET_KEY';
export const SERVICE_SECRET = 'SERVICE_SECRET';

// ───── Header names (comunicación interna) ─────
export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_SERVICE_SECRET = 'x-service-secret';
export const HEADER_USER_ID = 'x-user-id';
export const HEADER_USER_ROLE = 'x-user-role';

// ───── Metadata keys ─────
export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

// ───── Roles (espejo del identity service) ─────
export enum Role {
  CUSTOMER = 'CUSTOMER',
  DELIVERY = 'DELIVERY',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN',
}
