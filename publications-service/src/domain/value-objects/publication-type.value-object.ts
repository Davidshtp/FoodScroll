import { InvalidPublicationDataError } from '../errors/domain.errors';

export class PublicationType {
  constructor(private readonly value: string) {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new InvalidPublicationDataError('Publication type must be a non-empty string');
    }

    this.value = value.trim();
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
