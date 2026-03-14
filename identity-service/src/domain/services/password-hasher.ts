/**
 * Domain Service Interface: PasswordHasher
 * Define el contrato para el hashing de contraseñas
 * DOMINIO PURO - Solo interfaz, sin implementación
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
