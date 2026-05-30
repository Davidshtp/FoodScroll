import { Restaurant } from '../entities/restaurant.entity';
import { RestaurantAddress } from '../entities/restaurant-address.entity';
import { RestaurantOpeningHours } from '../entities/restaurant-opening-hours.entity';

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');

export interface RestaurantRepository {
  save(restaurant: Restaurant): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findByUserId(userId: string): Promise<Restaurant | null>;
  deleteById(id: string): Promise<void>;

  saveAddress(address: RestaurantAddress): Promise<RestaurantAddress>;
  findAddressByRestaurantId(restaurantId: string): Promise<RestaurantAddress | null>;
  deleteAddressById(restaurantId: string): Promise<void>;

  upsertOpeningHours(hours: RestaurantOpeningHours[]): Promise<RestaurantOpeningHours[]>;
  findOpeningHoursByRestaurantId(restaurantId: string): Promise<RestaurantOpeningHours[]>;
  deleteOpeningHoursByRestaurantId(restaurantId: string): Promise<void>;
}
