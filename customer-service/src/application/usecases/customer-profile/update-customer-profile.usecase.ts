import { Inject, Injectable } from '@nestjs/common';
import { CustomerProfile } from '../../../domain/entities/customer-profile.entity';
import { Gender } from '../../../domain/value-objects/gender.vo';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';

export interface UpdateCustomerProfileInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: Gender;
}

export interface UpdateCustomerProfileOutput {
  profile: CustomerProfile;
}

@Injectable()
export class UpdateCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
  ) { }

  async execute(input: UpdateCustomerProfileInput): Promise<UpdateCustomerProfileOutput> {
    const existing = await this.profileRepo.findByUserId(input.userId);
    if (!existing) {
      throw new CustomerProfileNotFoundError(input.userId);
    }

    const updated = existing.update({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarUrl: input.avatarUrl ?? undefined,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      gender: input.gender,
    });

    await this.profileRepo.save(updated);

    return { profile: updated };
  }
}
