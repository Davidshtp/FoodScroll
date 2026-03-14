import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../config/constants';

/**
 * Marca un endpoint como público (sin JWT).
 * El JwtAuthGuard global lo respetará y no pedirá token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
