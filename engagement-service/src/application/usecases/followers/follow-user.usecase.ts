import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { FollowerRepository, FOLLOWER_REPOSITORY } from '../../../domain/repositories/follower.repository';
import { CannotFollowSelfError } from '../../../domain/errors/domain.errors';

@Injectable()
export class FollowUserUseCase {
  constructor(
    @Inject(FOLLOWER_REPOSITORY)
    private readonly followerRepo: FollowerRepository,
  ) {}

  async execute(
    followerId: string,
    userRole: string,
    appStatus: string,
    followedId: string,
  ): Promise<{ following: boolean }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los usuarios pueden seguir a otros');
    }

    if (appStatus !== 'COMPLETED') {
      throw new ForbiddenException('Debes completar tu perfil para seguir usuarios');
    }

    if (followerId === followedId) {
      throw new CannotFollowSelfError();
    }

    const result = await this.followerRepo.follow(followerId, followedId);
    return { following: result };
  }
}
