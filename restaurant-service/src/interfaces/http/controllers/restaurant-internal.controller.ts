import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ServiceSecretGuard } from '../guards/service-secret.guard';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { Inject } from '@nestjs/common';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';

@Controller('restaurant/internal')
@UseGuards(ServiceSecretGuard)
export class RestaurantInternalController {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  @Get(':restaurantId')
  async findById(@Param('restaurantId') restaurantId: string) {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(restaurantId);
    }

    const address = await this.restaurantRepo.findAddressByRestaurantId(restaurantId);

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        phone: restaurant.phone,
        email: restaurant.email,
        logoUrl: restaurant.logoUrl,
      },
      address: address
        ? {
            id: address.id,
            address: address.address,
            cityId: address.cityId,
            latitude: address.latitude,
            longitude: address.longitude,
          }
        : null,
    };
  }
}
