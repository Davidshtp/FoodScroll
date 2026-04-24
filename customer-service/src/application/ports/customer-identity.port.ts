export enum OnboardingStatus {
  REQUIRED_BASIC_CONFIG = 'REQUIRED_BASIC_CONFIG',
  REQUIRED_ADDRESS = 'REQUIRED_ADDRESS',
  COMPLETED = 'COMPLETED',
}

export interface UpdateOnboardingInput {
  userId: string;
  onboardingStatus: string;
  authorization: string;
}

export interface UpdateOnboardingOutput {
  access_token: string;
}

export interface CustomerIdentityPort {
  updateOnboarding(input: UpdateOnboardingInput): Promise<UpdateOnboardingOutput>;
}

export const CUSTOMER_IDENTITY_PORT = Symbol('CustomerIdentityPort');