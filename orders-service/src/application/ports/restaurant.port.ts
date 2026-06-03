export interface RestaurantPort {
  validateRestaurantExists(restaurantId: string, authorization: string): Promise<void>;
  getRestaurantByUserId(userId: string, authorization: string): Promise<string>;
}

export const RESTAURANT_PORT = 'RESTAURANT_PORT';