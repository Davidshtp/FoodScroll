import { DeliveryProfile } from '../entities/delivery-profile.entity';
import { VehicleType } from '../enums/vehicle-type.enum';

export const DELIVERY_PROFILE_REPOSITORY = Symbol(
  'DELIVERY_PROFILE_REPOSITORY',
);

export interface DeliveryProfileRepository {
  save(profile: DeliveryProfile): Promise<DeliveryProfile>;
  findByUserId(userId: string): Promise<DeliveryProfile | null>;
  updateVehicleType(
    profileId: string,
    vehicleType: VehicleType | null,
  ): Promise<void>;
}
