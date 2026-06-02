import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CommentRepository, COMMENT_REPOSITORY } from '../../../domain/repositories/comment.repository';
import { Comment } from '../../../domain/entities/comment.entity';

@Injectable()
export class GetCommentsUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepo: CommentRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    publicationId: string,
  ): Promise<Comment[]> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('No tienes permiso para ver comentarios');
    }

    return this.commentRepo.findByPublicationId(publicationId);
  }

  async countByPublication(
    userId: string,
    userRole: string,
    publicationId: string,
  ): Promise<number> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('No tienes permiso para ver comentarios');
    }

    return this.commentRepo.countByPublication(publicationId);
  }
}
