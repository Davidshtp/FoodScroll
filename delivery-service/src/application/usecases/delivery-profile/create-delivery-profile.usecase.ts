import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
import { DeliveryProfileAlreadyExistsError } from '../../../domain/errors/domain.errors';

export interface CreateDeliveryProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: Date;
  gender: Gender;
  vehicleType: VehicleType;
}

export interface CreateDeliveryProfileOutput {
  profile: DeliveryProfile;
}

@Injectable()
export class CreateDeliveryProfileUseCase {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
  ) {}

  async execute(
    input: CreateDeliveryProfileInput,
  ): Promise<CreateDeliveryProfileOutput> {
    const existing = await this.profileRepo.findByUserId(input.userId);
    if (existing) {
      throw new DeliveryProfileAlreadyExistsError(input.userId);
    }

    const profile = DeliveryProfile.create(
      uuidv4(),
      input.userId,
      input.firstName,
      input.lastName,
      input.phone,
      input.documentType,
      input.documentNumber,
      input.birthDate,
      input.gender,
      input.vehicleType,
      this.generateDefaultAvatar(input.firstName, input.lastName),
    );

    const saved = await this.profileRepo.save(profile);
    return { profile: saved };
  }

  private generateDefaultAvatar(firstName: string, lastName: string): string {
    const colors = [
      'FF5733', 'C0392B', '8E44AD', '2980B9', '1ABC9C',
      '27AE60', 'F39C12', 'D35400', '2C3E50', 'E91E63',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const name = encodeURIComponent(`${firstName} ${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=${color}&color=fff&rounded=true`;
  }
}
