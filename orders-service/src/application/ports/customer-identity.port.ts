export interface CustomerIdentityPort {
  validateUserId(userId: string, authorization: string): Promise<void>;
}

export const CUSTOMER_IDENTITY_PORT = 'CUSTOMER_IDENTITY_PORT';