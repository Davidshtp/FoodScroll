import { Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/value-objects/role.vo';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { PasswordHasher, PASSWORD_HASHER } from '../../../domain/services/password-hasher';
import { TokenGenerator, TOKEN_GENERATOR } from '../../ports/token-generator.port';
import { InvalidCredentialsError,AccessDeniedError} from '../../../domain/errors/domain.errors';

export interface LoginInput {
  email: string;
  password: string;
  client: ClientApp;
}

export interface LoginOutput {
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
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGenerator,
  ) {}

  private isRoleAllowedForClient(role: Role, client: ClientApp): boolean {
    if (client === ClientApp.CUSTOMER) return role === Role.CUSTOMER;
    if (client === ClientApp.DELIVERY) return role === Role.DELIVERY;
    if (client === ClientApp.RESTAURANT) return role === Role.RESTAURANT || role === Role.ADMIN;
    return false;
  }

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await this.hasher.compare(input.password, user.getPasswordHash());
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    if (!this.isRoleAllowedForClient(user.role, input.client)) {
      throw new AccessDeniedError();
    }

    const accessToken = this.tokenGen.generateAccessToken({
      sub: user.id,
      role: user.role,
      client: input.client,
      tokenVersion: user.tokenVersion,
      appStatus: user.appStatus,
    });

    const refreshToken = this.tokenGen.generateRefreshToken({
      sub: user.id,
      type: 'refresh',
      client: input.client,
    });

    // Guardar el refresh token hasheado
    const hashedRefresh = await this.hasher.hash(refreshToken);
    const updatedUser = user.setRefreshToken(hashedRefresh);
    await this.userRepo.save(updatedUser);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        appStatus: user.appStatus,
      },
    };
  }
}
