import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from '../../config/constants';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Neo4jService');
  private driver: Driver;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const uri = this.config.get<string>(NEO4J_URI);
    const user = this.config.get<string>(NEO4J_USER);
    const password = this.config.get<string>(NEO4J_PASSWORD);

    if (!uri || !user || !password) {
      throw new Error('Neo4j configuration is incomplete. Check NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD');
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    await this.driver.verifyConnectivity();
    this.logger.log('Neo4j driver initialized and connected');
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      this.logger.log('Neo4j driver closed');
    }
  }

  getSession(): Session {
    return this.driver.session();
  }

  async run<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  async runSingle<T = any>(query: string, params: Record<string, any> = {}): Promise<T | null> {
    const results = await this.run<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }

  async executeWrite<T>(callback: (tx: { run: (query: string, params: Record<string, any>) => any }) => Promise<T>): Promise<T> {
    const session = this.driver.session();
    try {
      return await session.executeWrite(async (tx) => {
        return await callback({ run: (query, params) => tx.run(query, params) });
      });
    } finally {
      await session.close();
    }
  }
}
