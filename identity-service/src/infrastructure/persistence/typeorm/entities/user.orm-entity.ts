import {Entity,Column,PrimaryColumn,CreateDateColumn,UpdateDateColumn,DeleteDateColumn} from 'typeorm';

/**
 * ORM Entity: UserOrmEntity
 * Entidad de persistencia para TypeORM
 * Solo para infraestructura - No usar en dominio
 */
@Entity('user')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: ['CUSTOMER', 'DELIVERY', 'RESTAURANT', 'ADMIN'], default: 'CUSTOMER' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedRefreshToken: string | null;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  appStatus: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
