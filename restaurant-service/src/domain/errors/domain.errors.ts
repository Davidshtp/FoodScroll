export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class RestaurantAlreadyExistsError extends DomainError {
  constructor(userId: string) {
    super(`El restaurante para el usuario "${userId}" ya existe`);
  }
}

export class RestaurantNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Restaurante con ID "${identifier}" no encontrado`
        : 'Restaurante no encontrado',
    );
  }
}

export class RestaurantAddressNotFoundError extends DomainError {
  constructor(restaurantId?: string) {
    super(
      restaurantId
        ? `Direccion no encontrada para restaurante "${restaurantId}"`
        : 'Direccion no encontrada',
    );
  }
}

export class RestaurantOpeningHoursInvalidError extends DomainError {
  constructor() {
    super('Horario de apertura invalido');
  }
}

export class DuplicateDayOfWeekError extends DomainError {
  constructor(dayOfWeek: number) {
    super(`El dia ${dayOfWeek} esta duplicado en el body`);
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
