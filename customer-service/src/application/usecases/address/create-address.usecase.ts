import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Address } from '../../../domain/entities/address.entity';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';
import { OnboardingStatus } from '../../../domain/value-objects/onboarding-status.vo';
import { APP_STATUS_EVENTS_PUBLISHER, AppStatusEventsPublisher, createAppStatusUpdatedEvent } from 'src/application/ports';

export interface CreateAddressInput {
  customerId: string;
  cityId: string;
  alias: string;
  mainAddress: string | null;
  neighborhood: string;
  details?: string;
  latitude: number;
  longitude: number;
}

export interface CreateAddressOutput {
  address: Address;
}

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(APP_STATUS_EVENTS_PUBLISHER)
    private readonly appStatusEventsPublisher: AppStatusEventsPublisher,
  ) { }

  async execute(input: CreateAddressInput): Promise<CreateAddressOutput> {
    const profile = await this.profileRepo.findByUserId(input.customerId);
    if (!profile) {
      throw new CustomerProfileNotFoundError(input.customerId);
    }

    const address = Address.create({
      id: uuid(),
      customerId: input.customerId,
      cityId: input.cityId,
      alias: input.alias,
      mainAddress: input.mainAddress,
      neighborhood: input.neighborhood,
      details: input.details ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    await this.addressRepo.save(address);

    if (profile.onboardingStatus === OnboardingStatus.REQUIRED_ADDRESS) {
      const updatedProfile = profile.completeOnboarding();
      await this.profileRepo.save(updatedProfile);
      // Publicar evento de actualización de estado de onboarding
      await this.appStatusEventsPublisher.publishAppStatusUpdated(
        createAppStatusUpdatedEvent({
          userId: updatedProfile.userId,
          updatedAt: updatedProfile.updatedAt,
          onboardingStatus: updatedProfile.onboardingStatus,
        }),
      );

    }

    return { address };
  }
}
