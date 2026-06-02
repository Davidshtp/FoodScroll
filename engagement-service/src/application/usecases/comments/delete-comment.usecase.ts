import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CommentRepository, COMMENT_REPOSITORY } from '../../../domain/repositories/comment.repository';
import { CommentNotFoundError, CommentOwnershipError } from '../../../domain/errors/domain.errors';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepo: CommentRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    commentId: string,
  ): Promise<{ deleted: boolean }> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('No tienes permiso para eliminar comentarios');
    }

    const comment = await this.commentRepo.findById(commentId);

    if (!comment) {
      throw new CommentNotFoundError(commentId);
    }

    if (comment.userId !== userId) {
      throw new CommentOwnershipError();
    }

    await this.deleteRecursive(commentId);
    return { deleted: true };
  }

  private async deleteRecursive(commentId: string): Promise<void> {
    const replies = await this.commentRepo.findByParentId(commentId);
    for (const reply of replies) {
      await this.deleteRecursive(reply.id);
    }
    await this.commentRepo.delete(commentId);
  }
}
