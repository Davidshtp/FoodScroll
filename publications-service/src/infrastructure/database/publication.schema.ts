import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type PublicationDocument = Publication & Document;

@Schema({ timestamps: true, collection: 'publications' })
export class Publication {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true })
  restaurantId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['OFFER', 'EVENT', 'NEWS', 'PROMOTION'] })
  type: string;

  @Prop({ type: [String], required: true })
  imageUrls: string[];

  @Prop({ default: Date.now })
  publishedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const PublicationSchema = SchemaFactory.createForClass(Publication);
