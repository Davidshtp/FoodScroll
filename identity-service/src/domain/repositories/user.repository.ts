import { User } from '../entities/user.entity';

/**
 * Repository Interface: UserRepository
 * Define el contrato para la persistencia de usuarios
 * DOMINIO PURO - Solo interfaz, sin implementación
 */
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
