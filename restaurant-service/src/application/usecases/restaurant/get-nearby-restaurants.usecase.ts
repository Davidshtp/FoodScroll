import { Inject, Injectable } from '@nestjs/common';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';

interface NearbyRestaurantResult {
  restaurantId: string;
  name: string;
  logoUrl: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

@Injectable()
export class GetNearbyRestaurantsUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<NearbyRestaurantResult[]> {
    const restaurantsWithAddresses =
      await this.restaurantRepo.findAllWithAddresses();

    const nearby: NearbyRestaurantResult[] = [];

    for (const { restaurant, address } of restaurantsWithAddresses) {
      const distanceKm = this.calculateHaversineDistance(
        latitude,
        longitude,
        address.latitude,
        address.longitude,
      );

      if (distanceKm <= radiusKm) {
        nearby.push({
          restaurantId: restaurant.id,
          name: restaurant.name,
          logoUrl: restaurant.logoUrl,
          distanceKm: Math.round(distanceKm * 100) / 100,
          latitude: address.latitude,
          longitude: address.longitude,
        });
      }
    }

    nearby.sort((a, b) => a.distanceKm - b.distanceKm);

    return nearby;
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
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
