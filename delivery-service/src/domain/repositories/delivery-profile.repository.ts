import { DeliveryProfile } from '../entities/delivery-profile.entity';

export const DELIVERY_PROFILE_REPOSITORY = Symbol(
  'DELIVERY_PROFILE_REPOSITORY',
);

export interface DeliveryProfileRepository {
  save(profile: DeliveryProfile): Promise<DeliveryProfile>;
  findById(id: string): Promise<DeliveryProfile | null>;
  findByUserId(userId: string): Promise<DeliveryProfile | null>;
  setActiveVehicle(profileId: string, vehicleId: string | null): Promise<void>;
  delete(id: string): Promise<void>;
}
