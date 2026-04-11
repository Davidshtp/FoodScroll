import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como público (sin JWT ni service-secret).
 * Los guards globales (JwtAuthGuard y ServiceSecretGuard) lo respetarán.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
