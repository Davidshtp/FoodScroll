import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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

  @Get('by-user-ids')
  async findByUserIds(@Query('ids') ids: string) {
    if (!ids) return { restaurants: [] };
    const userIds = ids.split(',').filter(Boolean);
    if (userIds.length === 0) return { restaurants: [] };

    const restaurants = await this.restaurantRepo.findByUserIds(userIds);
    return {
      restaurants: restaurants.map(r => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        logoUrl: r.logoUrl,
      })),
    };
  }

  @Get('addresses')
  async findAddresses(@Query('ids') ids: string) {
    if (!ids) return { addresses: [] };
    const restaurantIds = ids.split(',').filter(Boolean);
    if (restaurantIds.length === 0) return { addresses: [] };

    const addressMap = await this.restaurantRepo.findAddressesByRestaurantIds(restaurantIds);
    const addresses = restaurantIds
      .filter(id => addressMap.has(id))
      .map(id => ({ restaurantId: id, ...addressMap.get(id)! }));

    return { addresses };
  }

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
