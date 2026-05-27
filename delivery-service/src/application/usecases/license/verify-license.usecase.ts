import { Inject, Injectable } from '@nestjs/common';
import {
  DriverLicense,
  VehicleSoat,
  VehicleTechno,
  Vehicle,
} from '../../../domain';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  LicenseCaptchaResolutionError,
  LicenseNeedsManualDataError,
  LicenseVerificationError,
  LicenseAlreadyExistsError,
  VehicleNotFoundError,
} from '../../../domain/errors/domain.errors';
import {
  LICENSE_VERIFICATION_PORT,
  RuntLicenseVerificationPort,
} from '../../ports/runt-license-verification.port';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { VehicleSharedHelper } from '../vehicle/vehicle-shared.helper';
import { OnboardingCalculator } from '../../services/onboarding-calculator.service';

export interface VerifyLicenseInput {
  userId: string;
  imageBuffer?: Buffer;
  documentType?: string;
  documentNumber?: string;
  authorization?: string;
}

export interface VerifyLicenseOutput {
  license: DriverLicense;
  status: {
    canWork: boolean;
    reasons: string[];
  };
  access_token: string;
}

@Injectable()
export class VerifyLicenseUseCase {
  constructor(
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    @Inject(LICENSE_VERIFICATION_PORT)
    private readonly licensePort: RuntLicenseVerificationPort,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly onboardingCalculator: OnboardingCalculator,
  ) {}

  async execute(input: VerifyLicenseInput): Promise<VerifyLicenseOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const existing = await this.licenseRepo.findByProfileId(profile.id);
    if (existing) {
      throw new LicenseAlreadyExistsError(profile.id);
    }

    const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
    const activeVehicle = vehicles.length > 0 ? vehicles[0] : null;
    if (!activeVehicle) {
      throw new VehicleNotFoundError('active');
    }

    const runtAccessToken =
      input.authorization?.replace(/^Bearer\s+/i, '').trim() || '';
    const result = await this.licensePort.verifyFullAuto({
      imageBuffer: input.imageBuffer,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      maxAttempts: 5,
      retryDelayMs: 500,
      accessToken: runtAccessToken,
    });

    if (result.needsManualInput) {
      if (
        result.manualStep === 'captcha' &&
        result.sessionId &&
        result.captchaPngBase64
      ) {
        throw new LicenseCaptchaResolutionError(
          JSON.stringify({
            sessionId: result.sessionId,
            captchaPngBase64: result.captchaPngBase64,
            documentType: result.prefill?.documentType,
            documentNumber: result.prefill?.documentNumber,
          }),
        );
      }
      if (result.manualStep === 'document_data') {
        throw new LicenseNeedsManualDataError(
          JSON.stringify({
            prefill: result.prefill || {},
            ocr: result.ocr || {},
          }),
        );
      }
      throw new LicenseNeedsManualDataError(
        JSON.stringify({
          prefill: result.prefill || {},
          ocr: result.ocr || {},
        }),
      );
    }

    if (result.error || !result.licenseNumber) {
      throw new LicenseVerificationError(
        result.message || 'Error en verificación de licencia RUNT',
        result.code || 'LICENSE_VERIFICATION_ERROR',
      );
    }

    const issueDate = result.issueDate ? new Date(result.issueDate) : null;
    const isActive =
      result.active ?? (result.status || '').toUpperCase() === 'ACTIVA';
    const verifiedDocumentNumber =
      result.documentNumber || input.documentNumber || profile.documentNumber;

    const existingByDoc =
      await this.licenseRepo.findByDocumentNumberIncludingDeleted(
        verifiedDocumentNumber,
      );
    if (existingByDoc?.deletedAt) {
      await this.licenseRepo.restore(verifiedDocumentNumber);
    }

    const license = DriverLicense.create(
      verifiedDocumentNumber,
      profile.id,
      result.licenseNumber,
      result.issuingOffice,
      issueDate || undefined,
      result.status,
      isActive,
      new Date(),
    );

    const saved = await this.licenseRepo.save(license);

    const { soatVigente, rtmVigente } = await this.getVehicleStatus(
      activeVehicle,
    );

    const onboarding = this.onboardingCalculator.calculate({
      vehicleType: profile.vehicleType,
      hasActiveVehicle: true,
      hasActiveLicense: true,
      soatVigente,
      rtmVigente,
      licenseActiva: saved.isActive,
    });

    let accessToken = '';
    if (input.authorization) {
      const identityResult = await this.identityPort.updateUserStatus({
        userId: profile.userId,
        onboardingStatus: onboarding.onboardingStatus,
        isActive: onboarding.isActive,
        authorization: input.authorization,
      });
      accessToken = identityResult.access_token;
    }

    const reasons: string[] = [];
    if (!soatVigente) reasons.push('SOAT_NO_VIGENTE');
    if (!rtmVigente) reasons.push('RTM_NO_VIGENTE');
    if (!saved.isActive) reasons.push('LICENCIA_NO_ACTIVA');

    return {
      license: saved,
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
