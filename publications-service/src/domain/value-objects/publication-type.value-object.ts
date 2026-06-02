import { InvalidPublicationDataError } from '../errors/domain.errors';

export class PublicationType {
  private static readonly VALID_TYPES = ['OFFER', 'EVENT', 'NEWS', 'PROMOTION'];

  constructor(private readonly value: string) {
    if (!value || typeof value !== 'string') {
      throw new InvalidPublicationDataError('Publication type must be a non-empty string');
    }

    const upperValue = value.toUpperCase();
    if (!PublicationType.VALID_TYPES.includes(upperValue)) {
      throw new InvalidPublicationDataError(
        `Invalid publication type. Valid types are: ${PublicationType.VALID_TYPES.join(', ')}`,
      );
    }

    this.value = upperValue;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PublicationType): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): PublicationType {
    return new PublicationType(value);
  }
}