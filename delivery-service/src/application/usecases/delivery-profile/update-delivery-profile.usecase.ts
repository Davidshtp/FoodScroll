import { Inject, Injectable } from '@nestjs/common';
import { DeliveryProfile, Gender } from '../../../domain';
import {
  DeliveryProfileRepository,
  DELIVERY_PROFILE_REPOSITORY,
} from '../../../domain/repositories';
import { DeliveryProfileNotFoundError } from '../../../domain/errors/domain.errors';
import { GetDeliveryProfileUseCase } from './get-delivery-profile.usecase';

export interface UpdateDeliveryProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: Gender;
  avatarUrl?: string;
}

export interface UpdateDeliveryProfileOutput {
  profile: DeliveryProfile;
}

@Injectable()
export class UpdateDeliveryProfileUseCase {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
  ) {}

  async execute(
    userId: string,
    input: UpdateDeliveryProfileInput,
  ): Promise<UpdateDeliveryProfileOutput> {
    const result = await this.getProfileUseCase.execute(userId);
    if (!result || !result.profile) {
      throw new DeliveryProfileNotFoundError(userId);
    }
    const existing = result.profile;

    const now = new Date();
    const updated = new DeliveryProfile(
      existing.id,
      existing.userId,
      input.firstName ?? existing.firstName,
      input.lastName ?? existing.lastName,
      input.phone ?? existing.phone,
      existing.documentType,
      existing.documentNumber,
      existing.birthDate,
      input.gender ?? existing.gender,
      existing.vehicleType,
      input.avatarUrl ?? existing.avatarUrl,
      existing.createdAt,
      now,
    );

    const saved = await this.profileRepo.save(updated);
    return { profile: saved };
  }
}
