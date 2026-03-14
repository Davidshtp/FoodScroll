import { Code } from '../../../../domain/entities/code.entity';
import { CodeType } from '../../../../domain/value-objects/code-type.vo';
import { CodeStatus } from '../../../../domain/value-objects/code-status.vo';
import { CodeOrmEntity } from '../entities/code.orm-entity';

/**
 * Mapper: CodeMapper
 * Convierte entre entidad de dominio y entidad ORM
 */
export class CodeMapper {
  static toDomain(orm: CodeOrmEntity): Code {
    return Code.reconstitute({
      id: orm.id,
      code: orm.code,
      userId: orm.userId,
      type: orm.type as CodeType,
      status: orm.status as CodeStatus,
      failedAttempts: orm.failedAttempts,
      expiresAt: orm.expiresAt,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: Code): CodeOrmEntity {
    const orm = new CodeOrmEntity();
    orm.id = domain.id;
    orm.code = domain.code;
    orm.userId = domain.userId;
    orm.type = domain.type;
    orm.status = domain.status;
    orm.failedAttempts = domain.failedAttempts;
    orm.expiresAt = domain.expiresAt;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
