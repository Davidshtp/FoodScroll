import { User } from '../../../../domain/entities/user.entity';
import { Role } from '../../../../domain/value-objects/role.vo';
import { UserOrmEntity } from '../entities/user.orm-entity';

/**
 * Mapper: UserMapper
 * Convierte entre entidad de dominio y entidad ORM
 */
export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: orm.id,
      email: orm.email,
      passwordHash: orm.password,
      role: orm.role as Role,
      isActive: orm.isActive,
      isVerified: orm.isVerified,
      hashedRefreshToken: orm.hashedRefreshToken,
      tokenVersion: orm.tokenVersion,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ?? null,
      appStatus: orm.appStatus ?? null,
    });
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.email = domain.email;
    orm.password = domain.getPasswordHash();
    orm.role = domain.role;
    orm.isActive = domain.isActive;
    orm.isVerified = domain.isVerified;
    orm.hashedRefreshToken = domain.hashedRefreshToken;
    orm.tokenVersion = domain.tokenVersion;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt ?? null;
    orm.appStatus = domain.appStatus ?? null;
    return orm;
  }
}
