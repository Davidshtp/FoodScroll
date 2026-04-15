import { Inject, Injectable } from '@nestjs/common';
import {
  DeliveryProfile,
  DocumentType,
  Gender,
  VehicleType,
} from '../../../domain';
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
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: Date;
  gender?: Gender;
  vehicleType?: VehicleType;
  avatarUrl?: string;
  isActive?: boolean;
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

    const updated = new DeliveryProfile(
      existing.id,
      existing.userId,
      input.firstName ?? existing.firstName,
      input.lastName ?? existing.lastName,
      input.phone ?? existing.phone,
      input.documentType ?? existing.documentType,
      input.documentNumber ?? existing.documentNumber,
      input.birthDate ?? existing.birthDate,
      input.gender ?? existing.gender,
      input.vehicleType ?? existing.vehicleType,
      input.isActive !== undefined ? input.isActive : existing.isActive,
      input.avatarUrl ?? existing.avatarUrl,
      existing.activeVehicleId,
    );

    const saved = await this.profileRepo.save(updated);
    return { profile: saved };
  }
}
