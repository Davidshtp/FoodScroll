import { Vehicle } from '../entities/vehicle.entity';
import { VehicleSoat } from '../entities/vehicle-soat.entity';
import { VehicleTechno } from '../entities/vehicle-techno.entity';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findAllByProfileId(profileId: string): Promise<Vehicle[]>;
  softDelete(id: string): Promise<void>;
  findSoatsByVehicleId(vehicleId: string): Promise<VehicleSoat[]>;
  findTechnosByVehicleId(vehicleId: string): Promise<VehicleTechno[]>;
}
