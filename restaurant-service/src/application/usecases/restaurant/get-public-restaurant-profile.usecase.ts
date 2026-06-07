import { Inject, Injectable } from '@nestjs/common';
import { Restaurant } from '../../../domain/entities/restaurant.entity';
import { RestaurantAddress } from '../../../domain/entities/restaurant-address.entity';
import { RestaurantOpeningHours } from '../../../domain/entities/restaurant-opening-hours.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetPublicRestaurantProfileOutput {
  id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: {
    address: string;
    cityId: string;
    latitude: number;
    longitude: number;
  } | null;
  openingHours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];
}

@Injectable()
export class GetPublicRestaurantProfileUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(restaurantId: string): Promise<GetPublicRestaurantProfileOutput> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(restaurantId);
    }

    const address = await this.restaurantRepo.findAddressByRestaurantId(restaurantId);
    const hours = await this.restaurantRepo.findOpeningHoursByRestaurantId(restaurantId);

    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      email: restaurant.email,
      logoUrl: restaurant.logoUrl,
      bannerUrl: restaurant.bannerUrl,
      address: address
        ? {
            address: address.address,
            cityId: address.cityId,
            latitude: address.latitude,
            longitude: address.longitude,
          }
        : null,
      openingHours: hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      })),
    };
  }
}
