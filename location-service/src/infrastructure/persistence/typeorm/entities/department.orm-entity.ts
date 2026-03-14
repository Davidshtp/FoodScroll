import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { CityOrmEntity } from './city.orm-entity';

@Entity({ name: 'department' })
export class DepartmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name: string;

  @OneToMany(() => CityOrmEntity, (city) => city.department)
  cities: CityOrmEntity[];
}
