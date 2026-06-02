import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { LikeRepository, LIKE_REPOSITORY } from '../../../domain/repositories/like.repository';

@Injectable()
export class ToggleLikeUseCase {
  constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly likeRepo: LikeRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    appStatus: string,
    publicationId: string,
  ): Promise<{ liked: boolean; count: number }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los clientes pueden dar like');
    }

    if (appStatus !== 'COMPLETED') {
      throw new ForbiddenException('Debes completar tu perfil para dar like');
    }

    const liked = await this.likeRepo.toggleLike(userId, publicationId);
    const count = await this.likeRepo.getLikeCount(publicationId);

    return { liked, count };
  }
}
