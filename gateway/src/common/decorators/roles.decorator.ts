import { SetMetadata } from '@nestjs/common';
import { Role, ROLES_KEY } from '../../config/constants';

/**
 * Declara los roles requeridos para acceder al endpoint.
 * Se usa junto al RolesGuard global.
 * Ejemplo: @Roles(Role.ADMIN, Role.RESTAURANT)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
