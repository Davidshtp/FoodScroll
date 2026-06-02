import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CommentRepository, COMMENT_REPOSITORY } from '../../../domain/repositories/comment.repository';
import { Comment } from '../../../domain/entities/comment.entity';
import { InvalidCommentDataError } from '../../../domain/errors/domain.errors';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepo: CommentRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    appStatus: string,
    publicationId: string,
    text: string,
    parentId?: string,
  ): Promise<Comment> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('Solo clientes y restaurantes pueden comentar');
    }

    if (userRole === 'CUSTOMER' && appStatus !== 'COMPLETED') {
      throw new ForbiddenException('Debes completar tu perfil para comentar');
    }

    if (!text || text.trim() === '') {
      throw new InvalidCommentDataError('El texto del comentario es obligatorio');
    }

    if (text.length > 2000) {
      throw new InvalidCommentDataError('El comentario no puede superar 2000 caracteres');
    }

    const comment = Comment.create(userId, userRole, publicationId, text.trim(), parentId);
    return this.commentRepo.save(comment);
  }
}
