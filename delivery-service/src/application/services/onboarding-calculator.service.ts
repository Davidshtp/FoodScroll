import { Injectable } from '@nestjs/common';
import { VehicleType } from '../../domain/enums/vehicle-type.enum';
import { OnboardingStatus } from '../ports/delivery-identity.port';

export interface OnboardingCalculationInput {
  vehicleType: VehicleType | null;
  hasActiveVehicle: boolean;
  hasActiveLicense: boolean;
  soatVigente: boolean;
  rtmVigente: boolean;
  licenseActiva: boolean;
}

export interface OnboardingCalculationResult {
  onboardingStatus: OnboardingStatus;
  isActive: boolean;
  reasons: string[];
}

@Injectable()
export class OnboardingCalculator {
  calculate(input: OnboardingCalculationInput): OnboardingCalculationResult {
    const { vehicleType } = input;

    if (
      vehicleType === VehicleType.BICYCLE ||
      vehicleType === VehicleType.WALKING
    ) {
      return {
        onboardingStatus: OnboardingStatus.COMPLETED,
        isActive: true,
        reasons: [],
      };
    }

    if (!input.hasActiveVehicle) {
      return {
        onboardingStatus: OnboardingStatus.REQUIRED_VEHICLE,
        isActive: false,
        reasons: [],
      };
    }

    if (!input.hasActiveLicense) {
      return {
        onboardingStatus: OnboardingStatus.REQUIRED_LICENSE,
        isActive: false,
        reasons: [],
      };
    }

    const reasons: string[] = [];
    if (!input.soatVigente) reasons.push('SOAT_NO_VIGENTE');
    if (!input.rtmVigente) reasons.push('RTM_NO_VIGENTE');
    if (!input.licenseActiva) reasons.push('LICENCIA_NO_ACTIVA');

    return {
      onboardingStatus: OnboardingStatus.COMPLETED,
      isActive: reasons.length === 0,
      reasons,
    };
  }
}
