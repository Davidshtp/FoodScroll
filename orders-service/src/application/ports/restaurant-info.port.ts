export interface RestaurantInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  logoUrl: string;
  address: {
    id: string;
    address: string;
    cityId: string;
    latitude: number;
    longitude: number;
  } | null;
}

export interface RestaurantInfoPort {
  getRestaurantInfo(restaurantId: string): Promise<RestaurantInfo>;
}

export const RESTAURANT_INFO_PORT = 'RESTAURANT_INFO_PORT';
