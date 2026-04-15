import { Vehicle } from '../entities/vehicle.entity';
import { VehicleSoat } from '../entities/vehicle-soat.entity';
import { VehicleTechno } from '../entities/vehicle-techno.entity';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findByProfileId(profileId: string): Promise<Vehicle | null>;
  findAllByProfileId(profileId: string): Promise<Vehicle[]>;
  findActiveByProfileIdFromProfile(
    profileId: string,
    activeVehicleId: string,
  ): Promise<Vehicle | null>;
  softDelete(id: string): Promise<void>;

  saveSoat(soat: VehicleSoat): Promise<VehicleSoat>;
  findSoatsByVehicleId(vehicleId: string): Promise<VehicleSoat[]>;

  saveTechno(techno: VehicleTechno): Promise<VehicleTechno>;
  findTechnosByVehicleId(vehicleId: string): Promise<VehicleTechno[]>;
}
