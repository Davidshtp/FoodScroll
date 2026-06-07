import { Injectable, Logger } from '@nestjs/common';
import { LikeRepository } from '../../../domain/repositories/like.repository';
import { Neo4jService } from '../neo4j.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class Neo4jLikeRepository implements LikeRepository {
  private readonly logger = new Logger('Neo4jLikeRepository');

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly redis: RedisService,
  ) {}

  async toggleLike(userId: string, publicationId: string): Promise<boolean> {
    const liked = await this.neo4j.executeWrite(async (tx) => {
      const result = await tx.run(
        'OPTIONAL MATCH (u:User {id: $userId})-[r:LIKES]->(p:Publication {id: $publicationId}) RETURN r IS NOT NULL AS hasLike',
        { userId, publicationId },
      );
      const hasLike = result.records?.[0]?.get('hasLike') ?? false;

      if (hasLike) {
        await tx.run(
          'MATCH (u:User {id: $userId})-[r:LIKES]->(p:Publication {id: $publicationId}) DELETE r',
          { userId, publicationId },
        );
        return false;
      } else {
        await tx.run(
          `MERGE (u:User {id: $userId})
           MERGE (p:Publication {id: $publicationId})
           MERGE (u)-[r:LIKES]->(p)
           SET r.createdAt = datetime()`,
          { userId, publicationId },
        );
        return true;
      }
    });

    const luaScript = `
      local key = KEYS[1]
      local countKey = KEYS[2]
      local member = ARGV[1]
      local wasAdded = redis.call('SISMEMBER', key, member)
      if wasAdded == 1 then
        redis.call('SREM', key, member)
        redis.call('DECR', countKey)
        return 0
      else
        redis.call('SADD', key, member)
        redis.call('INCR', countKey)
        return 1
      end
    `;
    await this.redis.eval(luaScript,
      [`pub:${publicationId}:likes`, `pub:${publicationId}:likes:count`],
      [userId],
    );

    return liked;
  }

  async getLikeCount(publicationId: string): Promise<number> {
    const cached = await this.redis.get(`pub:${publicationId}:likes:count`);
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const result = await this.neo4j.runSingle<{ count: number }>(
      'MATCH (p:Publication {id: $publicationId})<-[:LIKES]-() RETURN count(*) AS count',
      { publicationId },
    );

    const count = result?.count ?? 0;
    await this.redis.set(`pub:${publicationId}:likes:count`, count);
    return count;
  }

  async hasUserLiked(userId: string, publicationId: string): Promise<boolean> {
    const cached = await this.redis.sismember(`pub:${publicationId}:likes`, userId);
    if (cached) return true;

    const result = await this.neo4j.runSingle<{ liked: number }>(
      'MATCH (u:User {id: $userId})-[:LIKES]->(p:Publication {id: $publicationId}) RETURN count(*) AS liked',
      { userId, publicationId },
    );

    return (result?.liked ?? 0) > 0;
  }

  async getUserLikedPublications(userId: string): Promise<string[]> {
    const result = await this.neo4j.run<{ publicationId: string }>(
      'MATCH (u:User {id: $userId})-[r:LIKES]->(p:Publication) RETURN p.id AS publicationId ORDER BY r.createdAt DESC',
      { userId },
    );

    return result.map(r => r.publicationId);
  }

  async rebuildCache(publicationId: string): Promise<void> {
    const users = await this.neo4j.run<{ userId: string }>(
      'MATCH (u:User)-[:LIKES]->(p:Publication {id: $publicationId}) RETURN u.id AS userId',
      { publicationId },
    );

    const key = `pub:${publicationId}:likes`;
    const countKey = `pub:${publicationId}:likes:count`;

    await this.redis.del(key);
    if (users.length > 0) {
      await this.redis.sadd(key, ...users.map((u) => u.userId));
    }
    await this.redis.set(countKey, users.length);
  }
}
