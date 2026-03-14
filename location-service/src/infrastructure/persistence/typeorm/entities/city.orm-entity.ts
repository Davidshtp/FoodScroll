import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DepartmentOrmEntity } from './department.orm-entity';

@Entity({ name: 'city' })
export class CityOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => DepartmentOrmEntity, (department) => department.cities, {
    nullable: false,
  })
  @JoinColumn({ name: 'department_id' })
  department: DepartmentOrmEntity;
}
