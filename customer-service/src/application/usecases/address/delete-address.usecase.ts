import { Inject, Injectable } from '@nestjs/common';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { AddressNotFoundError, AddressOwnershipError } from '../../../domain/errors/domain.errors';
import { OnboardingStatus, APP_STATUS_EVENTS_PUBLISHER, AppStatusEventsPublisher, createAppStatusUpdatedEvent } from '../../ports/customer-events.port';

export interface DeleteAddressInput {
  addressId: string;
  customerId: string;
  accessToken?: string;
}

export interface DeleteAddressOutput {
  deletedAddress: {
    id: string;
    alias: string;
  };
}

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(APP_STATUS_EVENTS_PUBLISHER)
    private readonly appStatusEventsPublisher: AppStatusEventsPublisher,
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

    if (wasLastAddress) {
      await this.appStatusEventsPublisher.publishAppStatusUpdated(
        createAppStatusUpdatedEvent({
          userId: input.customerId,
          updatedAt: new Date(),
          onboardingStatus: OnboardingStatus.REQUIRED_ADDRESS,
          accessToken: input.accessToken,
        }),
      );
    }

    return {
      deletedAddress: {
        id: address.id,
        alias: address.alias,
      },
    };
  }
}
