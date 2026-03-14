import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/value-objects/role.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { PasswordHasher, PASSWORD_HASHER } from '../../../domain/services/password-hasher';
import { TokenGenerator, TOKEN_GENERATOR } from '../../ports/token-generator.port';
import { InvalidRefreshTokenError } from '../../../domain/errors/domain.errors';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    appStatus: string | null;
  };
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGenerator,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // Verificar el refresh token
    const payload = this.tokenGen.verifyRefreshToken(input.refreshToken);
    if (!payload) {
      throw new InvalidRefreshTokenError();
    }

    // Validar que sea un refresh token
    if (payload.type !== 'refresh') {
      throw new InvalidRefreshTokenError();
    }

    // Buscar usuario
    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new InvalidRefreshTokenError();
    }

    // Verificar que el refresh token coincida
    const valid = await this.hasher.compare(input.refreshToken, user.hashedRefreshToken);
    if (!valid) {
      throw new InvalidRefreshTokenError();
    }

    // Generar nuevos tokens (rotation)
    const newAccessToken = this.tokenGen.generateAccessToken({
      sub: user.id,
      role: user.role,
      client: payload.client,
      tokenVersion: user.tokenVersion,
      appStatus: user.appStatus,
    });

    const newRefreshToken = this.tokenGen.generateRefreshToken({
      sub: user.id,
      type: 'refresh',
      client: payload.client,
    });

    // Guardar el nuevo refresh token hasheado
    const hashedRefresh = await this.hasher.hash(newRefreshToken);
    const updatedUser = user.setRefreshToken(hashedRefresh);
    await this.userRepo.save(updatedUser);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        appStatus: user.appStatus,
      },
    };
  }
}
