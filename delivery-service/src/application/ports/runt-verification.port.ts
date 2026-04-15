export const RUNT_VERIFICATION_PORT = Symbol('RUNT_VERIFICATION_PORT');

export interface RuntVerificationPort {
  verifyFullAuto(params: {
    imageBuffer?: Buffer;
    plate?: string;
    documentType?: string;
    documentNumber?: string;
    maxAttempts?: number;
    retryDelayMs?: number;
    debug?: boolean;
  }): Promise<RuntVerifyFullAutoResult>;

  verifyManual(params: {
    sessionId: string;
    plate: string;
    documentType: string;
    documentNumber: string;
    captchaText: string;
  }): Promise<RuntVerifyResult>;
}

export interface RuntVerifyFullAutoResult {
  error?: boolean;
  code?: string;
  message?: string;
  ocr?: {
    plate: string;
    ownerDocumentType: string;
    ownerDocumentNumber: string;
    confidence: Record<string, number>;
  };
  verification?: RuntVerifyResult;
  attemptsUsed?: number;
  captcha?: {
    solvedAutomatically: boolean;
    confidence: number;
    failedAttempts: number;
  };
  needsManualInput?: boolean;
  manualStep?: 'license_data' | 'captcha';
  prefill?: {
    plate: string;
    documentType: string;
    documentNumber: string;
  };
  sessionId?: string;
  captchaPngBase64?: string;
}

export interface RuntVerifyResult {
  vehicleInfo?: {
    plate: string;
    transitLicenseNumber?: string;
    serviceType?: string;
    vehicleClass?: string;
    classification?: string;
    brand?: string;
    line?: string;
    modelYear?: number;
    color?: string;
    engineDisplacementCc?: number;
    transitAuthority?: string;
    liensStatus?: 'SI' | 'NO';
  };
  soatHistory?: Array<{
    policyNumber?: string;
    insurer?: string;
    status?: string;
    issuanceStatus?: string;
    origin?: string;
    tariffType?: string;
    issuedAt?: string;
    startDate?: string;
    endDate?: string;
  }>;
  rtmHistory?: Array<{
    certificateNumber?: string;
    reviewType?: string;
    cda?: string;
    status?: string;
    isCurrent?: string;
    issuedAt?: string;
    expiresAt?: string;
    plate?: string;
    consistency?: string;
    certificateUrl?: string;
  }>;
  soatStatus?: string;
  rtmStatus?: string;
  error?: boolean;
  code?: string;
  message?: string;
}
