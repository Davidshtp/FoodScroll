export interface CustomerProfileInfo {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
}

export interface CustomerAddressInfo {
  id: string;
  details: string | null;
  mainAddress: string | null;
  neighborhood: string;
  latitude: number;
  longitude: number;
  cityId: string;
}

export interface CustomerInfoPort {
  getCustomerInfo(userId: string): Promise<{
    profile: CustomerProfileInfo;
    deliveryAddress: CustomerAddressInfo | null;
  }>;
}

export const CUSTOMER_INFO_PORT = 'CUSTOMER_INFO_PORT';
