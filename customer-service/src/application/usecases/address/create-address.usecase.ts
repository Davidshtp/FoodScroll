import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Address } from '../../../domain/entities/address.entity';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { CustomerProfileNotFoundError, AddressCoordinatesAlreadyExistsError } from '../../../domain/errors/domain.errors';
import { OnboardingStatus, CUSTOMER_IDENTITY_PORT, CustomerIdentityPort } from '../../ports/customer-identity.port';

const ADDRESS_DUPLICATE_THRESHOLD_METERS = 30;

export interface CreateAddressInput {
  customerId: string;
  cityId: string;
  alias: string;
  mainAddress: string | null;
  neighborhood: string;
  details?: string;
  latitude: number;
  longitude: number;
  authorization?: string;
}

export interface CreateAddressOutput {
  address: Address;
  access_token?: string;
}

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(CUSTOMER_IDENTITY_PORT)
    private readonly identityPort: CustomerIdentityPort,
  ) { }

  async execute(input: CreateAddressInput): Promise<CreateAddressOutput> {
    const profile = await this.profileRepo.findByUserId(input.customerId);
    if (!profile) {
      throw new CustomerProfileNotFoundError(input.customerId);
    }

    const existingAddresses = await this.addressRepo.findByCustomerId(input.customerId);

    this.validateNoDuplicateCoordinates(input.latitude, input.longitude, existingAddresses);

    const wasFirstAddress = existingAddresses.length === 0;

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

    let accessToken: string | undefined;
    if (wasFirstAddress && input.authorization) {
      const result = await this.identityPort.updateOnboarding({
        userId: input.customerId,
        onboardingStatus: OnboardingStatus.COMPLETED,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return { address, access_token: accessToken };
  }

  private validateNoDuplicateCoordinates(
    latitude: number,
    longitude: number,
    existingAddresses: Address[],
  ): void {
    for (const address of existingAddresses) {
      const distance = this.calculateHaversineDistance(
        latitude,
        longitude,
        address.latitude,
        address.longitude,
      );

      if (distance < ADDRESS_DUPLICATE_THRESHOLD_METERS) {
        throw new AddressCoordinatesAlreadyExistsError();
      }
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}