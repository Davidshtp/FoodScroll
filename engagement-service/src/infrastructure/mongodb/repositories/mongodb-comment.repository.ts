import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRepository } from '../../../domain/repositories/comment.repository';
import { Comment } from '../../../domain/entities/comment.entity';
import { CommentSchema, CommentDocument } from '../schemas/comment.schema';

@Injectable()
export class MongoDBCommentRepository implements CommentRepository {
  constructor(
    @InjectModel(CommentSchema.name)
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  private toDomain(doc: CommentDocument): Comment {
    return Comment.reconstitute({
      id: String(doc._id),
      userId: doc.userId,
      userRole: doc.userRole,
      publicationId: doc.publicationId,
      text: doc.text,
      parentId: doc.parentId ?? undefined,
      createdAt: doc.createdAt,
      deletedAt: doc.deletedAt ?? null,
    });
  }

  async save(comment: Comment): Promise<Comment> {
    const doc = new this.commentModel({
      _id: comment.id,
      userId: comment.userId,
      userRole: comment.userRole,
      publicationId: comment.publicationId,
      text: comment.text,
      parentId: comment.parentId ?? null,
      createdAt: comment.createdAt,
      deletedAt: comment.deletedAt,
    });

    await doc.save();
    return comment;
  }

  async findById(id: string): Promise<Comment | null> {
    const doc = await this.commentModel.findOne({ _id: id, deletedAt: null } as any).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByPublicationId(publicationId: string): Promise<Comment[]> {
    const docs = await this.commentModel
      .find({ publicationId, deletedAt: null })
      .sort({ createdAt: 1 })
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findByParentId(parentId: string): Promise<Comment[]> {
    const docs = await this.commentModel
      .find({ parentId, deletedAt: null })
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.commentModel.updateOne(
      { _id: id } as any,
      { $set: { deletedAt: new Date() } },
    ).exec();
  }

  async countByPublication(publicationId: string): Promise<number> {
    return this.commentModel.countDocuments({ publicationId, deletedAt: null }).exec();
  }
}
