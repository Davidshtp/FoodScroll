import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { FollowerRepository, FOLLOWER_REPOSITORY } from '../../../domain/repositories/follower.repository';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    @Inject(FOLLOWER_REPOSITORY)
    private readonly followerRepo: FollowerRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    targetUserId: string,
  ): Promise<{ following: { id: string; userId: string; createdAt: Date }[]; count: number }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los usuarios pueden ver seguidos');
    }

    const following = await this.followerRepo.getFollowing(targetUserId);
    const count = await this.followerRepo.countFollowing(targetUserId);

    return {
      following: following.map((f) => ({
        id: f.id,
        userId: f.followedId,
        createdAt: f.createdAt,
      })),
      count,
    };
  }
}
