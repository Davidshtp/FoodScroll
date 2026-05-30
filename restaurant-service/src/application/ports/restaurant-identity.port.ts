export const RESTAURANT_IDENTITY_PORT = Symbol('RESTAURANT_IDENTITY_PORT');

export interface UpdateRestaurantStatusInput {
  userId: string;
  onboardingStatus?: string;
  isActive?: boolean;
  authorization: string;
}

export interface UpdateRestaurantStatusOutput {
  access_token: string;
}

export interface RestaurantIdentityPort {
  updateUserStatus(
    input: UpdateRestaurantStatusInput,
  ): Promise<UpdateRestaurantStatusOutput>;
}
