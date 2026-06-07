// ───── Environment variables ─────
export const JWT_SECRET_KEY = 'JWT_SECRET_KEY';
export const SERVICE_SECRET = 'SERVICE_SECRET';

// ───── Header names (comunicación interna) ─────
export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_SERVICE_SECRET = 'x-service-secret';
export const HEADER_USER_ID = 'x-user-id';
export const HEADER_USER_ROLE = 'x-user-role';
export const HEADER_USER_APPSTATUS = 'x-user-appstatus';

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

// Enlace a los microservicios (espejo de las variables de entorno en .env)
export const IDENTITY_SERVICE_URL = 'IDENTITY_SERVICE_URL';
export const CUSTOMER_SERVICE_URL = 'CUSTOMER_SERVICE_URL';
export const LOCATION_SERVICE_URL = 'LOCATION_SERVICE_URL';
export const DELIVERY_SERVICE_URL = 'DELIVERY_SERVICE_URL';
export const RESTAURANT_SERVICE_URL = 'RESTAURANT_SERVICE_URL';
export const PUBLICATIONS_SERVICE_URL = 'PUBLICATIONS_SERVICE_URL';
export const ENGAGEMENT_SERVICE_URL = 'ENGAGEMENT_SERVICE_URL';
export const ORDERS_SERVICE_URL = 'ORDERS_SERVICE_URL';

export const GATEWAY_PORT = 'GATEWAY_PORT';
export const HTTP_TIMEOUT = 'HTTP_TIMEOUT';
export const HTTP_RETRIES = 'HTTP_RETRIES';
