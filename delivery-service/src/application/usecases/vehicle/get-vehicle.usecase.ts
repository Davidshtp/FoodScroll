import { Inject, Injectable } from '@nestjs/common';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';
import { Vehicle, VehicleSoat, VehicleTechno } from '../../../domain';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import { VehicleNotFoundError } from '../../../domain/errors/domain.errors';
import { GetDeliveryProfileUseCase } from '../delivery-profile';

export interface GetVehicleOutput {
  vehicle: Vehicle | null;
  soats: VehicleSoat[];
  technos: VehicleTechno[];
  vehicleType: VehicleType | null;
}

@Injectable()
export class GetVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
  ) {}

  async execute(userId: string, vehicleId?: string): Promise<GetVehicleOutput> {
    const { profile } = await this.getProfileUseCase.execute(userId);

    if (
      profile.vehicleType === VehicleType.BICYCLE ||
      profile.vehicleType === VehicleType.WALKING
    ) {
      return {
        vehicle: null,
        soats: [],
        technos: [],
        vehicleType: profile.vehicleType,
      };
    }

    let vehicle;
    if (vehicleId) {
      vehicle = await this.vehicleRepo.findById(vehicleId);
    } else {
      const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
      vehicle = vehicles.length > 0 ? vehicles[0] : null;
    }

    if (!vehicle) {
      throw new VehicleNotFoundError(vehicleId || 'active');
    }

    const soats = await this.vehicleRepo.findSoatsByVehicleId(vehicle.id);
    const technos = await this.vehicleRepo.findTechnosByVehicleId(vehicle.id);

    return { vehicle, soats, technos, vehicleType: profile.vehicleType };
  }
}
