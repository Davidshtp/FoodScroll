export enum OnboardingStatus {
  REQUIRED_BASIC_INFO = 'REQUIRED_BASIC_INFO',
  REQUIRED_VEHICLE = 'REQUIRED_VEHICLE',
  COMPLETED = 'COMPLETED',
}

export interface UpdateUserStatusInput {
  userId: string;
  onboardingStatus?: string;
  isActive?: boolean;
  authorization: string;
}

export interface UpdateUserStatusOutput {
  access_token: string;
}

export interface DeliveryIdentityPort {
  updateUserStatus(
    input: UpdateUserStatusInput,
  ): Promise<UpdateUserStatusOutput>;
}

export const DELIVERY_IDENTITY_PORT = Symbol('DeliveryIdentityPort');
