import { Department } from '../../../../domain/entities/department.entity';
import { DepartmentOrmEntity } from '../entities/department.orm-entity';

export class DepartmentMapper {
  static toDomain(orm: DepartmentOrmEntity): Department {
    return new Department(orm.id, orm.name);
  }

  static toOrm(domain: Department): DepartmentOrmEntity {
    const orm = new DepartmentOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    return orm;
  }
}
