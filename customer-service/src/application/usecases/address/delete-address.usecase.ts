import { Inject, Injectable } from '@nestjs/common';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { AddressNotFoundError, AddressOwnershipError } from '../../../domain/errors/domain.errors';
import { OnboardingStatus } from '../../../domain/value-objects/onboarding-status.vo';
import { APP_STATUS_EVENTS_PUBLISHER, AppStatusEventsPublisher, createAppStatusUpdatedEvent } from 'src/application/ports';

export interface DeleteAddressInput {
  addressId: string;
  customerId: string;
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

    await this.addressRepo.remove(address);

    const remaining = await this.addressRepo.findByCustomerId(input.customerId);
    if (remaining.length === 0) {
      const profile = await this.profileRepo.findByUserId(input.customerId);
      if (profile && profile.onboardingStatus === OnboardingStatus.COMPLETED) {
        const updatedProfile = profile.requireAddress();
        await this.profileRepo.save(updatedProfile);
        // emitimos evento de cambio de estado de onboarding para que identity-service sincronice el user.appStatus
        await this.appStatusEventsPublisher.publishAppStatusUpdated(
          createAppStatusUpdatedEvent({
            userId: updatedProfile.userId,
            updatedAt: updatedProfile.updatedAt,
            onboardingStatus: updatedProfile.onboardingStatus,
          }),
        );
      }
    }

    return {
      deletedAddress: {
        id: address.id,
        alias: address.alias,
      },
    };
  }
}
