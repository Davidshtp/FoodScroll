import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '../../config/constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RedisService');
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>(REDIS_HOST) || '127.0.0.1';
    const port = this.config.get<number>(REDIS_PORT) || 6379;

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 200, 5000);
      },
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('close', () => this.logger.warn('Redis connection closed'));
    this.client.on('reconnecting', (ms: number) => this.logger.log(`Redis reconnecting in ${ms}ms`));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));

    await this.client.connect().catch((err) => this.logger.error('Redis connect failed', err.message));
    await this.client.ping().catch((err) => this.logger.error('Redis ping failed', err.message));
    this.logger.log('Redis connection verified');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string | number, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async eval(script: string, keys: string[], args: (string | number)[]): Promise<any> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }
}
