import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository';

export interface SyncUserAppStatusInput {
  userId: string;
  onboardingStatus: string;
  updatedAt: string;
}

@Injectable()
export class SyncUserAppStatusUseCase {
  private readonly logger = new Logger(SyncUserAppStatusUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(input: SyncUserAppStatusInput): Promise<void> {
    const eventUpdatedAt = new Date(input.updatedAt);
    if (Number.isNaN(eventUpdatedAt.getTime())) {
      throw new Error(`updatedAt invalido para userId=${input.userId}`);
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new Error(`Usuario ${input.userId} no existe en identity-service`);
    }

    const updatedUser = user.setAppStatus(input.onboardingStatus, eventUpdatedAt);
    await this.userRepo.save(updatedUser);

    this.logger.log(
      `Usuario sincronizado userId=${input.userId} appStatus=${input.onboardingStatus} updatedAt=${input.updatedAt}`,
    );
  }
}
