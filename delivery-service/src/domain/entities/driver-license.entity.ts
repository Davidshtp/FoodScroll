export class DriverLicense {
  constructor(
    public readonly documentNumber: string,
    public readonly profileId: string,
    public readonly licenseNumber: string | null,
    public readonly issuingOffice: string | null,
    public readonly issueDate: Date | null,
    public readonly status: string | null,
    public readonly isActive: boolean,
    public readonly verifiedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(
    documentNumber: string,
    profileId: string,
    licenseNumber?: string,
    issuingOffice?: string,
    issueDate?: Date,
    status?: string,
    isActive: boolean = false,
    verifiedAt?: Date,
  ): DriverLicense {
    const now = new Date();
    return new DriverLicense(
      documentNumber,
      profileId,
      licenseNumber ?? null,
      issuingOffice ?? null,
      issueDate ?? null,
      status ?? null,
      isActive,
      verifiedAt ?? null,
      now,
      now,
      null,
    );
  }
}
