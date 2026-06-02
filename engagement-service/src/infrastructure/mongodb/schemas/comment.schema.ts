import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type CommentDocument = CommentSchema & Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true, collection: 'comments' })
export class CommentSchema {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true })
  publicationId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: String, default: null })
  parentId: string | null;

  @Prop({ default: null })
  deletedAt: Date;
}

export const CommentMongooseSchema = SchemaFactory.createForClass(CommentSchema);
