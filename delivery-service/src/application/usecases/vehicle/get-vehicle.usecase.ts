import { Inject, Injectable } from '@nestjs/common';
import { Vehicle } from '../../../domain';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import { VehicleNotFoundError } from '../../../domain/errors/domain.errors';
import { GetDeliveryProfileUseCase } from '../delivery-profile';

export interface GetVehicleOutput {
  vehicle: Vehicle;
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

    let vehicle;
    if (vehicleId) {
      vehicle = await this.vehicleRepo.findById(vehicleId);
    } else {
      vehicle = await this.vehicleRepo.findActiveByProfileIdFromProfile(
        profile.id,
        profile.activeVehicleId || '',
      );
    }

    if (!vehicle) {
      throw new VehicleNotFoundError(vehicleId || 'active');
    }

    return { vehicle };
  }
}
