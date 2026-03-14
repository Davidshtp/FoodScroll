import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/value-objects/role.vo';
import { ClientApp } from '../../../domain/value-objects/client-app.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { PasswordHasher, PASSWORD_HASHER } from '../../../domain/services/password-hasher';
import { UserAlreadyExistsError } from '../../../domain/errors/domain.errors';

export interface RegisterInput {
  email: string;
  password: string;
  client: ClientApp;
}

export interface RegisterOutput {
  message: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
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

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const exists = await this.userRepo.existsByEmail(input.email);
    if (exists) {
      throw new UserAlreadyExistsError(input.email);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const role = this.mapClientToRole(input.client);
    const id = crypto.randomUUID();

    const user = User.create({
      id,
      email: input.email,
      passwordHash,
      role,
    });

    await this.userRepo.save(user);

    return {
      message: 'Usuario registrado con éxito',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
