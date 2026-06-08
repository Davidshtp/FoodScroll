export interface CustomerProfileInfo {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
}

export interface CustomerInfoPort {
  getCustomerInfo(userId: string): Promise<CustomerProfileInfo>;
}

export const CUSTOMER_INFO_PORT = 'CUSTOMER_INFO_PORT';
