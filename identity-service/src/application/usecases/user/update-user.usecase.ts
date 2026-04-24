import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '../../../domain/value-objects/role.vo';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';
import { TokenGenerator, TOKEN_GENERATOR } from '../../ports/token-generator.port';

export interface UpdateUserInput {
  userId: string;
  requesterUserId: string;
  isActive?: boolean;
  onboardingStatus?: string;
}

export interface UpdateUserOutput {
  accessToken: string;
}

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGen: TokenGenerator,
  ) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new NotFoundException(`Usuario ${input.userId} no encontrado`);
    }

    if (input.requesterUserId !== input.userId) {
      const requester = await this.userRepo.findById(input.requesterUserId);
      if (!requester || requester.role !== Role.ADMIN) {
        throw new ForbiddenException('Solo el propio usuario o un ADMIN pueden actualizar');
      }
    }

    let updatedUser = user;

    if (input.isActive !== undefined) {
      if (input.isActive) {
        updatedUser = updatedUser.activate();
      } else {
        updatedUser = updatedUser.deactivate();
      }
    }

    if (input.onboardingStatus) {
      updatedUser = updatedUser.setAppStatus(input.onboardingStatus, new Date());
    }

    await this.userRepo.save(updatedUser);

    const newAccessToken = this.tokenGen.generateAccessToken({
      sub: updatedUser.id,
      role: updatedUser.role,
      client: 'app',
      tokenVersion: updatedUser.tokenVersion,
      appStatus: updatedUser.appStatus,
      isActive: updatedUser.isActive,
    });

    this.logger.log(
      `Usuario actualizado: userId=${updatedUser.id}, isActive=${updatedUser.isActive}, appStatus=${updatedUser.appStatus}`,
    );

    return { accessToken: newAccessToken };
  }
}