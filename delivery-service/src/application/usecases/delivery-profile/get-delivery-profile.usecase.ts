import { Inject, Injectable } from '@nestjs/common';
import { DeliveryProfile } from '../../../domain';
import {
  DeliveryProfileRepository,
  DELIVERY_PROFILE_REPOSITORY,
} from '../../../domain/repositories';
import { DeliveryProfileNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetDeliveryProfileOutput {
  profile: DeliveryProfile;
}

@Injectable()
export class GetDeliveryProfileUseCase {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
  ) {}

  async execute(userId: string): Promise<GetDeliveryProfileOutput> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new DeliveryProfileNotFoundError(userId);
    }
    return { profile };
  }
}
