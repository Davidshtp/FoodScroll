export class VehicleTechno {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly certificateNumber: string | null,
    public readonly reviewType: string | null,
    public readonly cdaName: string | null,
    public readonly status: string | null,
    public readonly isCurrent: string | null,
    public readonly issuedAt: Date | null,
    public readonly expiresAt: Date | null,
    public readonly plate: string | null,
    public readonly consistency: string | null,
    public readonly certificateUrl: string | null,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    vehicleId: string,
    certificateNumber?: string,
    reviewType?: string,
    cdaName?: string,
    status?: string,
    isCurrent?: string,
    issuedAt?: Date,
    expiresAt?: Date,
    plate?: string,
    consistency?: string,
    certificateUrl?: string,
  ): VehicleTechno {
    return new VehicleTechno(
      id,
      vehicleId,
      certificateNumber || null,
      reviewType || null,
      cdaName || null,
      status || null,
      isCurrent || null,
      issuedAt || null,
      expiresAt || null,
      plate || null,
      consistency || null,
      certificateUrl || null,
      new Date(),
    );
  }

  isVigente(): boolean {
    if (this.status !== 'VIGENTE') return false;
    if (!this.expiresAt) return false;
    return this.expiresAt >= new Date();
  }
}
