import { Inject, Injectable } from '@nestjs/common';
import { Vehicle, VehicleSoat, VehicleTechno } from '../../../domain';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
  VEHICLE_REPOSITORY,
  VehicleRepository,
} from '../../../domain/repositories';
import {
  LicenseNotFoundError,
} from '../../../domain/errors/domain.errors';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { OnboardingCalculator } from '../../services/onboarding-calculator.service';
import { VehicleSharedHelper } from '../vehicle/vehicle-shared.helper';

export interface DeleteLicenseInput {
  userId: string;
  authorization?: string;
}

export interface DeleteLicenseOutput {
  message: string;
  status: {
    canWork: boolean;
    reasons: string[];
  };
  access_token: string;
}

@Injectable()
export class DeleteLicenseUseCase {
  constructor(
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly onboardingCalculator: OnboardingCalculator,
  ) {}

  async execute(input: DeleteLicenseInput): Promise<DeleteLicenseOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const license = await this.licenseRepo.findByProfileId(profile.id);
    if (!license) {
      throw new LicenseNotFoundError(profile.id);
    }

    await this.licenseRepo.softDelete(license.documentNumber);

    const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
    const activeVehicle = vehicles.length > 0 ? vehicles[0] : null;

    let soatVigente = false;
    let rtmVigente = false;
    if (activeVehicle) {
      const status = await this.getVehicleStatus(activeVehicle);
      soatVigente = status.soatVigente;
      rtmVigente = status.rtmVigente;
    }

    const onboarding = this.onboardingCalculator.calculate({
      vehicleType: profile.vehicleType,
      hasActiveVehicle: !!activeVehicle,
      hasActiveLicense: false,
      soatVigente,
      rtmVigente,
      licenseActiva: false,
    });

    let accessToken = '';
    if (input.authorization) {
      const result = await this.identityPort.updateUserStatus({
        userId: profile.userId,
        onboardingStatus: onboarding.onboardingStatus,
        isActive: onboarding.isActive,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    const reasons: string[] = [];
    if (activeVehicle) {
      if (!soatVigente) reasons.push('SOAT_NO_VIGENTE');
      if (!rtmVigente) reasons.push('RTM_NO_VIGENTE');
    }
    reasons.push('LICENCIA_NO_ACTIVA');

    return {
      message: 'Licencia eliminada correctamente',
      status: { canWork: onboarding.isActive, reasons },
      access_token: accessToken,
    };
  }

  private async getVehicleStatus(vehicle: Vehicle): Promise<{
    soatVigente: boolean;
    rtmVigente: boolean;
  }> {
    const soats: VehicleSoat[] =
      await this.vehicleRepo.findSoatsByVehicleId(vehicle.id);
    const technos: VehicleTechno[] =
      await this.vehicleRepo.findTechnosByVehicleId(vehicle.id);

    const latestSoat = VehicleSharedHelper.getLatestFromArray(soats, 'endDate');
    const latestTechno = VehicleSharedHelper.getLatestFromArray(
      technos,
      'expiresAt',
    );

    const soatVigente = latestSoat ? latestSoat.isVigente() : false;
    const rtmVigente = latestTechno ? latestTechno.isVigente() : false;

    return { soatVigente, rtmVigente };
  }
}
