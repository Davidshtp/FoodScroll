import { Inject, Injectable } from '@nestjs/common';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';

export interface PublicAddress {
  id: string;
  alias: string;
  mainAddress: string | null;
  neighborhood: string;
  details: string | null;
  cityId: string;
  latitude: number;
  longitude: number;
}

export interface GetPublicCustomerProfileOutput {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  birthDate: Date;
  gender: string;
  addresses: PublicAddress[];
}

@Injectable()
export class GetPublicCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
  ) {}

  async execute(userId: string): Promise<GetPublicCustomerProfileOutput> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new CustomerProfileNotFoundError(userId);
    }

    const addresses = await this.addressRepo.findByCustomerId(userId);

    return {
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
      birthDate: profile.birthDate,
      gender: profile.gender,
      addresses: addresses.map(a => ({
        id: a.id,
        alias: a.alias,
        mainAddress: a.mainAddress,
        neighborhood: a.neighborhood,
        details: a.details,
        cityId: a.cityId,
        latitude: a.latitude,
        longitude: a.longitude,
      })),
    };
  }
}
