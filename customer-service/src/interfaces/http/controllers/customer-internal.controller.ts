import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ServiceSecretGuard } from '../guards/service-secret.guard';
import {
  CustomerProfileRepository,
  CUSTOMER_PROFILE_REPOSITORY,
} from '../../../domain/repositories/customer-profile.repository';
import {
  AddressRepository,
  ADDRESS_REPOSITORY,
} from '../../../domain/repositories/address.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';

@Controller('customer-profile/internal')
@UseGuards(ServiceSecretGuard)
export class CustomerInternalController {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string) {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new CustomerProfileNotFoundError(userId);
    }

    const addresses = await this.addressRepo.findByCustomerId(userId);
    const mainAddress = addresses.find(a => a.mainAddress !== null) ?? addresses[0] ?? null;

    return {
      profile: {
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      },
      deliveryAddress: mainAddress
        ? {
            id: mainAddress.id,
            details: mainAddress.details,
            mainAddress: mainAddress.mainAddress,
            neighborhood: mainAddress.neighborhood,
            latitude: mainAddress.latitude,
            longitude: mainAddress.longitude,
            cityId: mainAddress.cityId,
          }
        : null,
    };
  }
}
