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
    const alreadyLiked = await this.hasUserLiked(userId, publicationId);

    if (alreadyLiked) {
      await this.neo4j.run(
        'MATCH (u:User {id: $userId})-[r:LIKES]->(p:Publication {id: $publicationId}) DELETE r',
        { userId, publicationId },
      );
      await this.redis.srem(`pub:${publicationId}:likes`, userId);
      await this.redis.decr(`pub:${publicationId}:likes:count`);
      return false;
    } else {
      await this.neo4j.run(
        `MERGE (u:User {id: $userId})
         MERGE (p:Publication {id: $publicationId})
         MERGE (u)-[r:LIKES]->(p)
         SET r.createdAt = datetime()`,
        { userId, publicationId },
      );
      await this.redis.sadd(`pub:${publicationId}:likes`, userId);
      await this.redis.incr(`pub:${publicationId}:likes:count`);
      return true;
    }
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
