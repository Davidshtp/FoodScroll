export const LICENSE_VERIFICATION_PORT = Symbol('LICENSE_VERIFICATION_PORT');

export interface RuntLicenseVerificationPort {
  verifyFullAuto(params: {
    imageBuffer?: Buffer;
    documentType?: string;
    documentNumber?: string;
    maxAttempts?: number;
    retryDelayMs?: number;
    debug?: boolean;
    accessToken?: string;
  }): Promise<LicenseVerifyFullAutoResult>;

  verifyManual(params: {
    sessionId: string;
    documentType: string;
    documentNumber: string;
    captchaText: string;
    accessToken?: string;
  }): Promise<LicenseVerifyResult>;
}

export interface LicenseVerifyFullAutoResult {
  error?: boolean;
  code?: string;
  message?: string;
  licenseNumber?: string;
  issuingOffice?: string;
  issueDate?: string;
  status?: string;
  active?: boolean;
  ocr?: {
    ownerDocumentType: string;
    ownerDocumentNumber: string;
    confidence: Record<string, number>;
  };
  verification?: LicenseVerifyResult;
  attemptsUsed?: number;
  captcha?: {
    solvedAutomatically: boolean;
    confidence: number;
    failedAttempts: number;
  };
  needsManualInput?: boolean;
  manualStep?: 'document_data' | 'captcha';
  prefill?: {
    documentType: string;
    documentNumber: string;
  };
  sessionId?: string;
  captchaPngBase64?: string;
}

export interface LicenseVerifyResult {
  licenseInfo?: {
    licenseNumber: string;
    issuingOffice: string;
    issueDate: string;
    status: string;
    restrictions?: string;
  };
  error?: boolean;
  code?: string;
  message?: string;
}
