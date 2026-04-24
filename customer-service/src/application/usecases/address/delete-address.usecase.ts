import { Inject, Injectable } from '@nestjs/common';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { AddressNotFoundError, AddressOwnershipError } from '../../../domain/errors/domain.errors';
import { OnboardingStatus, CUSTOMER_IDENTITY_PORT, CustomerIdentityPort } from '../../ports/customer-identity.port';

export interface DeleteAddressInput {
  addressId: string;
  customerId: string;
  authorization?: string;
}

export interface DeleteAddressOutput {
  deletedAddress: {
    id: string;
    alias: string;
  };
  access_token?: string;
}

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(CUSTOMER_IDENTITY_PORT)
    private readonly identityPort: CustomerIdentityPort,
  ) { }

  async execute(input: DeleteAddressInput): Promise<DeleteAddressOutput> {
    const address = await this.addressRepo.findById(input.addressId);
    if (!address) {
      throw new AddressNotFoundError(input.addressId);
    }

    if (address.customerId !== input.customerId) {
      throw new AddressOwnershipError();
    }

    const addressesBeforeDelete = await this.addressRepo.findByCustomerId(input.customerId);
    const wasLastAddress = addressesBeforeDelete.length === 1;

    await this.addressRepo.remove(address);

    let accessToken: string | undefined;
    if (wasLastAddress && input.authorization) {
      const result = await this.identityPort.updateOnboarding({
        userId: input.customerId,
        onboardingStatus: OnboardingStatus.REQUIRED_ADDRESS,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return {
      deletedAddress: {
        id: address.id,
        alias: address.alias,
      },
      access_token: accessToken,
    };
  }
}