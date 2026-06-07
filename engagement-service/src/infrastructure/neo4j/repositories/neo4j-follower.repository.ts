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
    const created = await this.neo4j.executeWrite(async (tx) => {
      const result = await tx.run(
        'OPTIONAL MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followed:User {id: $followedId}) RETURN r IS NOT NULL AS alreadyExists',
        { followerId, followedId },
      );
      const exists = result.records?.[0]?.get('alreadyExists') ?? false;
      if (exists) return false;

      await tx.run(
        `MERGE (follower:User {id: $followerId})
         MERGE (followed:User {id: $followedId})
         MERGE (follower)-[r:FOLLOWS]->(followed)
         SET r.createdAt = datetime()`,
        { followerId, followedId },
      );
      return true;
    });

    if (!created) return false;

    const luaScript = `
      local followersKey = KEYS[1]
      local followingKey = KEYS[2]
      local followersCountKey = KEYS[3]
      local followingCountKey = KEYS[4]
      local followerId = ARGV[1]
      local followedId = ARGV[2]
      local exists = redis.call('SISMEMBER', followersKey, followerId)
      if exists == 0 then
        redis.call('SADD', followersKey, followerId)
        redis.call('SADD', followingKey, followedId)
        redis.call('INCR', followersCountKey)
        redis.call('INCR', followingCountKey)
      end
      return 1
    `;
    await this.redis.eval(luaScript,
      [
        `user:${followedId}:followers`,
        `user:${followerId}:following`,
        `user:${followedId}:followers:count`,
        `user:${followerId}:following:count`,
      ],
      [followerId, followedId],
    );

    return true;
  }

  async unfollow(followerId: string, followedId: string): Promise<boolean> {
    const deleted = await this.neo4j.executeWrite(async (tx) => {
      const result = await tx.run(
        'OPTIONAL MATCH (f:User {id: $followerId})-[r:FOLLOWS]->(s:User {id: $followedId}) RETURN r IS NOT NULL AS exists',
        { followerId, followedId },
      );
      const relExists = result.records?.[0]?.get('exists') ?? false;
      if (!relExists) return false;

      await tx.run(
        'MATCH (f:User {id: $followerId})-[r:FOLLOWS]->(s:User {id: $followedId}) DELETE r',
        { followerId, followedId },
      );
      return true;
    });

    if (!deleted) return false;

    const luaScript = `
      local followersKey = KEYS[1]
      local followingKey = KEYS[2]
      local followersCountKey = KEYS[3]
      local followingCountKey = KEYS[4]
      local followerId = ARGV[1]
      local followedId = ARGV[2]
      local exists = redis.call('SISMEMBER', followersKey, followerId)
      if exists == 1 then
        redis.call('SREM', followersKey, followerId)
        redis.call('SREM', followingKey, followedId)
        redis.call('DECR', followersCountKey)
        redis.call('DECR', followingCountKey)
      end
      return 1
    `;
    await this.redis.eval(luaScript,
      [
        `user:${followedId}:followers`,
        `user:${followerId}:following`,
        `user:${followedId}:followers:count`,
        `user:${followerId}:following:count`,
      ],
      [followerId, followedId],
    );

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
      `MATCH (me:User {id: $userId})<-[r1:FOLLOWS]-(common:User)-[r2:FOLLOWS]->(other:User {id: $otherUserId})
       RETURN common.id AS mutualId, r2.createdAt AS createdAt
       ORDER BY r2.createdAt DESC`,
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
