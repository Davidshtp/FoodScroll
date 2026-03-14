import { Code } from '../entities/code.entity';
import { CodeType } from '../value-objects/code-type.vo';

/**
 * Repository Interface: CodeRepository
 * Define el contrato para la persistencia de códigos
 * DOMINIO PURO - Solo interfaz, sin implementación
 */
export interface CodeRepository {
  save(code: Code): Promise<void>;
  findValidByUserIdAndType(userId: string, type: CodeType): Promise<Code | null>;
  invalidateAllByUserIdAndType(userId: string, type: CodeType): Promise<void>;
  expireOldCodes(): Promise<number>;
}

export const CODE_REPOSITORY = Symbol('CodeRepository');
