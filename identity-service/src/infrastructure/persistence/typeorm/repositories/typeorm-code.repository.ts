import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Code } from '../../../../domain/entities/code.entity';
import { CodeType } from '../../../../domain/value-objects/code-type.vo';
import { CodeStatus } from '../../../../domain/value-objects/code-status.vo';
import { CodeRepository } from '../../../../domain/repositories/code.repository';
import { CodeOrmEntity } from '../entities/code.orm-entity';
import { CodeMapper } from '../mappers/code.mapper';

/**
 * TypeORM Implementation: CodeRepository
 * Implementación concreta del repositorio de códigos
 */
@Injectable()
export class TypeOrmCodeRepository implements CodeRepository {
  private readonly logger = new Logger(TypeOrmCodeRepository.name);

  constructor(
    @InjectRepository(CodeOrmEntity)
    private readonly repo: Repository<CodeOrmEntity>,
  ) {}

  async save(code: Code): Promise<void> {
    const orm = CodeMapper.toOrm(code);
    await this.repo.save(orm);
  }

  async findValidByUserIdAndType(
    userId: string,
    type: CodeType,
  ): Promise<Code | null> {
    const orm = await this.repo.findOne({
      where: {
        userId,
        type,
        status: CodeStatus.AVAILABLE,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
    return orm ? CodeMapper.toDomain(orm) : null;
  }

  async invalidateAllByUserIdAndType(
    userId: string,
    type: CodeType,
  ): Promise<void> {
    await this.repo.update(
      { userId, type, status: CodeStatus.AVAILABLE },
      { status: CodeStatus.EXPIRED },
    );
  }

  async expireOldCodes(): Promise<number> {
    const result = await this.repo.update(
      {
        status: CodeStatus.AVAILABLE,
        expiresAt: LessThanOrEqual(new Date()),
      },
      { status: CodeStatus.EXPIRED },
    );
    return result.affected || 0;
  }

  /**
   * Cron job para expirar códigos antiguos
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredCodes(): Promise<void> {
    try {
      const affected = await this.expireOldCodes();
      if (affected > 0) {
        this.logger.log(`Expired ${affected} code(s)`);
      }
    } catch (err) {
      this.logger.error('Error expiring codes', err);
    }
  }
}
