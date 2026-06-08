import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateCommentUseCase } from '../../../application/usecases/comments/create-comment.usecase';
import { GetCommentsUseCase } from '../../../application/usecases/comments/get-comments.usecase';
import { DeleteCommentUseCase } from '../../../application/usecases/comments/delete-comment.usecase';
import { CreateCommentDto } from '../../../application/dtos/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    const comment = await this.createCommentUseCase.execute(
      user.id,
      user.role,
      user.appStatus,
      dto.publicationId,
      dto.text,
      dto.parentId,
    );

    return {
      id: comment.id,
      userId: comment.userId,
      userRole: comment.userRole,
      publicationId: comment.publicationId,
      text: comment.text,
      parentId: comment.parentId ?? null,
      createdAt: comment.createdAt,
    };
  }

  @Get(':publicationId')
  async findAll(
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.getCommentsUseCase.execute(
      user.id,
      user.role,
      publicationId,
    );
  }

  @Get(':publicationId/count')
  async countByPublication(
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    const count = await this.getCommentsUseCase.countByPublication(
      user.id,
      user.role,
      publicationId,
    );
    return { count };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.deleteCommentUseCase.execute(user.id, user.role, id);
  }
}
