import { Follower } from '../entities/follower.entity';

export interface FollowerRepository {
  follow(followerId: string, followedId: string): Promise<boolean>;
  unfollow(followerId: string, followedId: string): Promise<boolean>;
  countFollowers(userId: string): Promise<number>;
  countFollowing(userId: string): Promise<number>;
  getFollowers(userId: string): Promise<Follower[]>;
  getFollowing(userId: string): Promise<Follower[]>;
  exists(followerId: string, followedId: string): Promise<boolean>;
  getMutualFollowers(userId: string, otherUserId: string): Promise<Follower[]>;
}

export const FOLLOWER_REPOSITORY = 'FOLLOWER_REPOSITORY';
