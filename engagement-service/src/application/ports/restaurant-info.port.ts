export interface RestaurantProfileInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  logoUrl: string;
}

export interface RestaurantInfoPort {
  getRestaurantInfoByUserId(userId: string): Promise<RestaurantProfileInfo>;
}

export const RESTAURANT_INFO_PORT = 'RESTAURANT_INFO_PORT';
