export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PublicationNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Publication with ID "${identifier}" not found`
        : 'Publication not found',
    );
  }
}

export class InvalidPublicationDataError extends DomainError {
  constructor(message: string) {
    super(`Invalid publication data: ${message}`);
  }
}

export class CloudinaryUploadError extends DomainError {
  constructor(detail?: string) {
    super(`Image upload failed${detail ? ': ' + detail : ''}`);
  }
}

export class CloudinaryDeleteError extends DomainError {
  constructor(detail?: string) {
    super(`Image deletion failed${detail ? ': ' + detail : ''}`);
  }
}
