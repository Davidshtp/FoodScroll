export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CustomerProfileAlreadyExistsError extends DomainError {
  constructor(userId: string) {
    super(`El perfil para el usuario "${userId}" ya existe`);
  }
}

export class CustomerProfileNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Perfil del usuario "${identifier}" no encontrado`
        : 'Perfil no encontrado',
    );
  }
}

export class AddressNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Dirección con ID "${identifier}" no encontrada`
        : 'Dirección no encontrada',
    );
  }
}

export class AddressOwnershipError extends DomainError {
  constructor() {
    super('No tienes permiso para modificar esta dirección');
  }
}

export class AddressCoordinatesAlreadyExistsError extends DomainError {
  constructor() {
    super('Ya tienes una dirección registrada en esta ubicación (dentro de 30 metros)');
  }
}

export class CloudinaryUploadError extends DomainError {
  constructor(detail?: string) {
    super(`Error al subir imagen${detail ? ': ' + detail : ''}`);
  }
}

export class CloudinaryDeleteError extends DomainError {
  constructor(detail?: string) {
    super(`Error al eliminar imagen${detail ? ': ' + detail : ''}`);
  }
}
