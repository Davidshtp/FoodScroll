import { Injectable, Logger } from '@nestjs/common';
import { FollowerRepository } from '../../../domain/repositories/follower.repository';
import { Follower } from '../../../domain/entities/follower.entity';
import { Neo4jService } from '../neo4j.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class Neo4jFollowerRepository implements FollowerRepository {
  private readonly logger = new Logger('Neo4jFollowerRepository');

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly redis: RedisService,
  ) {}

  async follow(followerId: string, followedId: string): Promise<boolean> {
    const exists = await this.exists(followerId, followedId);
    if (exists) return false;

    await this.neo4j.run(
      `MERGE (follower:User {id: $followerId})
       MERGE (followed:User {id: $followedId})
       MERGE (follower)-[r:FOLLOWS]->(followed)
       SET r.createdAt = datetime()`,
      { followerId, followedId },
    );

    await this.redis.sadd(`user:${followedId}:followers`, followerId);
    await this.redis.sadd(`user:${followerId}:following`, followedId);
    await this.redis.incr(`user:${followedId}:followers:count`);
    await this.redis.incr(`user:${followerId}:following:count`);

    return true;
  }

  async unfollow(followerId: string, followedId: string): Promise<boolean> {
    const exists = await this.exists(followerId, followedId);
    if (!exists) return false;

    await this.neo4j.run(
      'MATCH (f:User {id: $followerId})-[r:FOLLOWS]->(s:User {id: $followedId}) DELETE r',
      { followerId, followedId },
    );

    await this.redis.srem(`user:${followedId}:followers`, followerId);
    await this.redis.srem(`user:${followerId}:following`, followedId);
    await this.redis.decr(`user:${followedId}:followers:count`);
    await this.redis.decr(`user:${followerId}:following:count`);

    return true;
  }

  async countFollowers(userId: string): Promise<number> {
    const cached = await this.redis.get(`user:${userId}:followers:count`);
    if (cached !== null) return parseInt(cached, 10);

    const result = await this.neo4j.runSingle<{ count: number }>(
      'MATCH (u:User {id: $userId})<-[:FOLLOWS]-() RETURN count(*) AS count',
      { userId },
    );

    const count = result?.count ?? 0;
    await this.redis.set(`user:${userId}:followers:count`, count);
    return count;
  }

  async countFollowing(userId: string): Promise<number> {
    const cached = await this.redis.get(`user:${userId}:following:count`);
    if (cached !== null) return parseInt(cached, 10);

    const result = await this.neo4j.runSingle<{ count: number }>(
      'MATCH (u:User {id: $userId})-[:FOLLOWS]->() RETURN count(*) AS count',
      { userId },
    );

    const count = result?.count ?? 0;
    await this.redis.set(`user:${userId}:following:count`, count);
    return count;
  }

  async getFollowers(userId: string): Promise<Follower[]> {
    const records = await this.neo4j.run<{ followerId: string; createdAt: any }>(
      `MATCH (follower:User)-[r:FOLLOWS]->(u:User {id: $userId})
       RETURN follower.id AS followerId, r.createdAt AS createdAt
       ORDER BY r.createdAt DESC`,
      { userId },
    );

    return records.map((r) =>
      Follower.reconstitute({
        id: `${r.followerId}:${userId}`,
        followerId: r.followerId,
        followedId: userId,
        createdAt: r.createdAt,
      }),
    );
  }

  async getFollowing(userId: string): Promise<Follower[]> {
    const records = await this.neo4j.run<{ followedId: string; createdAt: any }>(
      `MATCH (u:User {id: $userId})-[r:FOLLOWS]->(followed:User)
       RETURN followed.id AS followedId, r.createdAt AS createdAt
       ORDER BY r.createdAt DESC`,
      { userId },
    );

    return records.map((r) =>
      Follower.reconstitute({
        id: `${userId}:${r.followedId}`,
        followerId: userId,
        followedId: r.followedId,
        createdAt: r.createdAt,
      }),
    );
  }

  async exists(followerId: string, followedId: string): Promise<boolean> {
    const result = await this.neo4j.runSingle<{ exists: number }>(
      'MATCH (f:User {id: $followerId})-[:FOLLOWS]->(s:User {id: $followedId}) RETURN count(*) AS exists',
      { followerId, followedId },
    );

    return (result?.exists ?? 0) > 0;
  }

  async getMutualFollowers(userId: string, otherUserId: string): Promise<Follower[]> {
    const records = await this.neo4j.run<{ mutualId: string; createdAt: any }>(
      `MATCH (me:User {id: $userId})<-[:FOLLOWS]-(common:User)-[:FOLLOWS]->(other:User {id: $otherUserId})
       RETURN common.id AS mutualId, common.createdAt AS createdAt
       ORDER BY common.createdAt DESC`,
      { userId, otherUserId },
    );

    return records.map((r) =>
      Follower.reconstitute({
        id: `${r.mutualId}:${userId}`,
        followerId: r.mutualId,
        followedId: userId,
        createdAt: r.createdAt,
      }),
    );
  }
}
