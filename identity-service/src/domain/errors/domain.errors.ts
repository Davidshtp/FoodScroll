/**
 * Domain Errors
 * Errores específicos del dominio - Sin dependencias externas
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Credenciales inválidas');
    this.name = 'InvalidCredentialsError';
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`El usuario con email ${email} ya existe`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Usuario no encontrado');
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCodeError extends DomainError {
  public readonly failedAttempts?: number;
  
  constructor(message?: string, failedAttempts?: number) {
    super(message || 'Código inválido o expirado');
    this.name = 'InvalidCodeError';
    this.failedAttempts = failedAttempts;
  }
}

export class CodeExpiredError extends DomainError {
  constructor() {
    super('Código inválido. El código ha expirado tras múltiples intentos erróneos');
    this.name = 'CodeExpiredError';
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor() {
    super('El email no ha sido verificado');
    this.name = 'EmailNotVerifiedError';
  }
}

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super('El email ya está verificado');
    this.name = 'EmailAlreadyVerifiedError';
  }
}

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('Refresh token inválido');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class AccessDeniedError extends DomainError {
  constructor(message?: string) {
    super(message || 'Acceso no permitido para este cliente');
    this.name = 'AccessDeniedError';
  }
}

export class TokenRevokedError extends DomainError {
  constructor() {
    super('Token revoked or invalid');
    this.name = 'TokenRevokedError';
  }
}
