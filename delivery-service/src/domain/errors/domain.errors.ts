export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class DeliveryProfileNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Delivery profile not found: ${id}`, 'DELIVERY_PROFILE_NOT_FOUND');
    this.name = 'DeliveryProfileNotFoundError';
  }
}

export class DeliveryProfileAlreadyExistsError extends DomainError {
  constructor(userId: string) {
    super(
      `Delivery profile already exists for user: ${userId}`,
      'DELIVERY_PROFILE_ALREADY_EXISTS',
    );
    this.name = 'DeliveryProfileAlreadyExistsError';
  }
}

export class VehicleNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Vehicle not found: ${id}`, 'VEHICLE_NOT_FOUND');
    this.name = 'VehicleNotFoundError';
  }
}

export class VehicleAlreadyExistsError extends DomainError {
  constructor(profileId: string) {
    super(
      `Vehicle already exists for profile: ${profileId}`,
      'VEHICLE_ALREADY_EXISTS',
    );
    this.name = 'VehicleAlreadyExistsError';
  }
}

export class RuntVerificationError extends DomainError {
  constructor(message: string, code: string = 'RUNT_VERIFICATION_ERROR') {
    super(message, code);
    this.name = 'RuntVerificationError';
  }
}

export class CaptchaResolutionError extends DomainError {
  constructor(message: string = 'No se pudo resolver el CAPTCHA') {
    super(message, 'CAPTCHA_RESOLUTION_ERROR');
    this.name = 'CaptchaResolutionError';
  }
}

export class RuntNeedsManualLicenseDataError extends DomainError {
  constructor(message: string = 'Se requieren datos manuales de licencia') {
    super(message, 'RUNT_NEEDS_MANUAL_LICENSE_DATA');
    this.name = 'RuntNeedsManualLicenseDataError';
  }
}
