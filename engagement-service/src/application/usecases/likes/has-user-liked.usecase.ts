import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { LikeRepository, LIKE_REPOSITORY } from '../../../domain/repositories/like.repository';

@Injectable()
export class HasUserLikedUseCase {
  constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly likeRepo: LikeRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    publicationId: string,
  ): Promise<{ liked: boolean }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los clientes pueden verificar likes');
    }

    const liked = await this.likeRepo.hasUserLiked(userId, publicationId);
    return { liked };
  }
}
