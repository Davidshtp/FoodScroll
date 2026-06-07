import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '../../../domain/value-objects/role.vo';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { PasswordHasher, PASSWORD_HASHER } from '../../../domain/services/password-hasher';
import { TokenGenerator, TOKEN_GENERATOR } from '../../ports/token-generator.port';
import { GoogleOAuthPort, GOOGLE_OAUTH, GoogleUserInfo } from '../../ports/google-oauth.port';
import { GoogleAuthError, AccessDeniedError } from '../../../domain/errors/domain.errors';

export interface GoogleLoginInput {
  idToken: string;
  client: ClientApp;
  /** Si no se provee, se usa GOOGLE_CLIENT_ID (web) por defecto */
  clientId?: string;
}

export interface GoogleLoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    appStatus: string | null;
    isActive: boolean;
  };
  isNewUser: boolean;
}

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(GOOGLE_OAUTH) private readonly googleOAuth: GoogleOAuthPort,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGenerator,
  ) {}

  private mapClientToRole(client: ClientApp): Role {
    switch (client) {
      case ClientApp.CUSTOMER:
        return Role.CUSTOMER;
      case ClientApp.DELIVERY:
        return Role.DELIVERY;
      case ClientApp.RESTAURANT:
        return Role.RESTAURANT;
      default:
        return Role.CUSTOMER;
    }
  }

  private isRoleAllowedForClient(role: Role, client: ClientApp): boolean {
    if (client === ClientApp.CUSTOMER) return role === Role.CUSTOMER;
    if (client === ClientApp.DELIVERY) return role === Role.DELIVERY;
    if (client === ClientApp.RESTAURANT) return role === Role.RESTAURANT || role === Role.ADMIN;
    return false;
  }

  async execute(input: GoogleLoginInput): Promise<GoogleLoginOutput> {
    const effectiveClientId = input.clientId ?? process.env.GOOGLE_CLIENT_ID ?? '';

    const googleInfo = await this.googleOAuth.verifyIdToken(
      input.idToken,
      effectiveClientId,
    );

    if (!googleInfo.email) {
      throw new GoogleAuthError('Google no proporcionó un email');
    }

    let user = await this.userRepo.findByEmail(googleInfo.email);
    let isNewUser = false;

    if (!user) {
      const role = this.mapClientToRole(input.client);
      const passwordHash = await this.hasher.hash(randomUUID());

      user = User.create({
        id: randomUUID(),
        email: googleInfo.email,
        passwordHash,
        role,
      });

      if (googleInfo.emailVerified) {
        user = user.verifyEmail();
      }

      await this.userRepo.save(user);
      isNewUser = true;
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
      isActive: user.isActive,
    });

    const refreshToken = this.tokenGen.generateRefreshToken({
      sub: user.id,
      type: 'refresh',
      client: input.client,
    });

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
        isActive: user.isActive,
      },
      isNewUser,
    };
  }
}
