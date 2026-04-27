import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Vehicle, VehicleSoat, VehicleTechno } from '../../../domain';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  RuntVerificationPort,
  RUNT_VERIFICATION_PORT,
} from '../../../application/ports/runt-verification.port';
import {
  CaptchaResolutionError,
  RuntNeedsManualLicenseDataError,
  RuntVerificationError,
  VehicleAlreadyExistsError,
} from '../../../domain/errors/domain.errors';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { VehicleSharedHelper } from './vehicle-shared.helper';

export interface RegisterVehicleInput {
  userId: string;
  imageBuffer?: Buffer;
  plate?: string;
  documentType?: string;
  documentNumber?: string;
  authorization?: string;
}

export interface RegisterVehicleOutput {
  vehicle: Vehicle;
  soats: VehicleSoat[];
  technos: VehicleTechno[];
  status: {
    canWork: boolean;
    reasons: string[];
  };
  access_token: string;
}

@Injectable()
export class RegisterVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    @Inject(RUNT_VERIFICATION_PORT)
    private readonly runtPort: RuntVerificationPort,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: RegisterVehicleInput): Promise<RegisterVehicleOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const existingVehicles = await this.vehicleRepo.findAllByProfileId(
      profile.id,
    );
    if (existingVehicles.length > 0) {
      throw new VehicleAlreadyExistsError(profile.id);
    }

    const hasImage = input.imageBuffer && input.imageBuffer.length > 0;
    const hasManualData = !!(
      input.plate &&
      input.documentType &&
      input.documentNumber
    );

    if (!hasImage && !hasManualData) {
      throw new RuntVerificationError(
        'Imagen o datos (plate+documentType+documentNumber) requeridos',
        'INVALID_INPUT',
      );
    }

    const runtAccessToken =
      input.authorization?.replace(/^Bearer\s+/i, '').trim() || '';
    const result = await this.runtPort.verifyFullAuto({
      imageBuffer: input.imageBuffer,
      plate: input.plate,
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
        throw new CaptchaResolutionError(
          JSON.stringify({
            sessionId: result.sessionId,
            captchaPngBase64: result.captchaPngBase64,
            plate: result.prefill?.plate,
            documentType: result.prefill?.documentType,
            documentNumber: result.prefill?.documentNumber,
          }),
        );
      }
      if (result.manualStep === 'license_data') {
        throw new RuntNeedsManualLicenseDataError(
          JSON.stringify({
            prefill: result.prefill || {},
            ocr: result.ocr || {},
          }),
        );
      }
      throw new RuntNeedsManualLicenseDataError(
        JSON.stringify({
          prefill: result.prefill || {},
          ocr: result.ocr || {},
        }),
      );
    }

    if (result.error || !result.verification) {
      throw new RuntVerificationError(
        result.message || 'Error en verificación RUNT',
        result.code || 'RUNT_VERIFICATION_ERROR',
      );
    }

    const verification = result.verification;
    const vehicleInfo = (verification.vehicleInfo || {}) as Record<string, any>;

    const vehicleType = VehicleSharedHelper.deriveVehicleType(
      vehicleInfo.classification,
      vehicleInfo.vehicleClass,
    );

    const latestSoat = VehicleSharedHelper.findLatestSoat(
      verification.soatHistory || [],
    );
    const latestTechno = VehicleSharedHelper.findLatestTechno(
      verification.rtmHistory || [],
    );

    return await this.dataSource.transaction(async (manager) => {
      const result = await VehicleSharedHelper.saveVehicleWithHistory(manager, {
        profileId: profile.id,
        vehicleType: vehicleType,
        plate: vehicleInfo.plate,
        brand: vehicleInfo.brand,
        line: vehicleInfo.line,
        modelYear: vehicleInfo.modelYear,
        color: vehicleInfo.color,
        soatStatus: verification.soatStatus ?? null,
        soatExpiry: latestSoat?.endDate ? new Date(latestSoat.endDate) : null,
        rtmStatus: verification.rtmStatus ?? null,
        rtmExpiry: latestTechno?.expiresAt
          ? new Date(latestTechno.expiresAt)
          : null,
        soatHistory: verification.soatHistory || [],
        rtmHistory: verification.rtmHistory || [],
        authorization: input.authorization,
        identityPort: this.identityPort,
        userId: profile.userId,
      });

      return {
        vehicle: result.vehicle,
        soats: result.soats,
        technos: result.technos,
        status: { canWork: result.canWork, reasons: result.reasons },
        access_token: result.accessToken,
      };
    });
  }
}
