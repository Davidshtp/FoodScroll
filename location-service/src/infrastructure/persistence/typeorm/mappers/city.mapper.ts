import { City } from '../../../../domain/entities/city.entity';
import { CityOrmEntity } from '../entities/city.orm-entity';

export class CityMapper {
  static toDomain(orm: CityOrmEntity): City {
    return new City(orm.id, orm.name, orm.departmentId);
  }

  static toOrm(domain: City): CityOrmEntity {
    const orm = new CityOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.departmentId = domain.departmentId;
    return orm;
  }
}
