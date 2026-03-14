import { Inject, Injectable } from '@nestjs/common';
import { CustomerProfile } from '../../../domain/entities/customer-profile.entity';
import { Address } from '../../../domain/entities/address.entity';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetCustomerProfileInput {
  userId: string;
}

export interface GetCustomerProfileOutput {
  profile: CustomerProfile;
  addresses: Address[];
}

@Injectable()
export class GetCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
  ) { }

  async execute(input: GetCustomerProfileInput): Promise<GetCustomerProfileOutput> {
    const profile = await this.profileRepo.findByUserId(input.userId);
    if (!profile) {
      throw new CustomerProfileNotFoundError(input.userId);
    }

    const addresses = await this.addressRepo.findByCustomerId(input.userId);

    return { profile, addresses };
  }
}
