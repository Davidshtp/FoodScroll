export interface DeliveryInfo {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
}

export interface DeliveryInfoPort {
  getDeliveryInfo(userId: string): Promise<DeliveryInfo>;
}

export const DELIVERY_INFO_PORT = 'DELIVERY_INFO_PORT';
