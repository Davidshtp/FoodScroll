import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } from '../../config/constants';
import { CommentSchema, CommentMongooseSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: `mongodb://${config.get<string>(DATABASE_HOST)}:${config.get<string>(DATABASE_PORT)}/${config.get<string>(DATABASE_NAME)}`,
      }),
    }),
    MongooseModule.forFeature([
      { name: CommentSchema.name, schema: CommentMongooseSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class EngagementMongoModule {}
