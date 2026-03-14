import {Entity,Column,PrimaryColumn,CreateDateColumn,ManyToOne,JoinColumn,Index} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

/**
 * ORM Entity: CodeOrmEntity
 * Entidad de persistencia para TypeORM
 * Solo para infraestructura - No usar en dominio
 */
@Index('idx_code_user', ['userId'])
@Entity('code')
export class CodeOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  code: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: ['AVAILABLE', 'USED', 'EXPIRED'], default: 'AVAILABLE' })
  status: string;

  @Column({ type: 'enum', enum: ['RESET_PASSWORD', 'CONFIRM_EMAIL'] })
  type: string;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserOrmEntity;
}
