export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DepartmentNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(identifier ? `Departamento con ID "${identifier}" no encontrado` : 'Departamento no encontrado');
  }
}

export class CityNotFoundError extends DomainError {
  constructor(identifier?: string) {
    super(identifier ? `Ciudad con ID "${identifier}" no encontrada` : 'Ciudad no encontrada');
  }
}

export class DuplicateDepartmentError extends DomainError {
  constructor(name: string) {
    super(`Ya existe un departamento con el nombre "${name}"`);
  }
}
