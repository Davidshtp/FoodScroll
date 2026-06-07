import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import {
  SERVER_PORT,
  JWT_SECRET_KEY,
  NEO4J_URI,
  NEO4J_USER,
  NEO4J_PASSWORD,
  REDIS_HOST,
  REDIS_PORT,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
} from '../../config/constants';

import { Neo4jModule } from '../../infrastructure/neo4j/neo4j.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { EngagementMongoModule } from '../../infrastructure/mongodb/mongodb.module';

import { Neo4jLikeRepository } from '../../infrastructure/neo4j/repositories/neo4j-like.repository';
import { Neo4jFollowerRepository } from '../../infrastructure/neo4j/repositories/neo4j-follower.repository';
import { MongoDBCommentRepository } from '../../infrastructure/mongodb/repositories/mongodb-comment.repository';

import { LIKE_REPOSITORY } from '../../domain/repositories/like.repository';
import { FOLLOWER_REPOSITORY } from '../../domain/repositories/follower.repository';
import { COMMENT_REPOSITORY } from '../../domain/repositories/comment.repository';

import { ToggleLikeUseCase } from '../../application/usecases/likes/toggle-like.usecase';
import { GetLikeCountUseCase } from '../../application/usecases/likes/get-like-count.usecase';
import { HasUserLikedUseCase } from '../../application/usecases/likes/has-user-liked.usecase';
import { GetUserLikedPublicationsUseCase } from '../../application/usecases/likes/get-user-liked-publications.usecase';
import { FollowUserUseCase } from '../../application/usecases/followers/follow-user.usecase';
import { UnfollowUserUseCase } from '../../application/usecases/followers/unfollow-user.usecase';
import { GetFollowersUseCase } from '../../application/usecases/followers/get-followers.usecase';
import { GetFollowingUseCase } from '../../application/usecases/followers/get-following.usecase';
import { GetMutualFollowersUseCase } from '../../application/usecases/followers/get-mutual-followers.usecase';
import { CreateCommentUseCase } from '../../application/usecases/comments/create-comment.usecase';
import { GetCommentsUseCase } from '../../application/usecases/comments/get-comments.usecase';
import { DeleteCommentUseCase } from '../../application/usecases/comments/delete-comment.usecase';

import { LikeController } from '../http/controllers/like.controller';
import { FollowerController } from '../http/controllers/follower.controller';
import { CommentController } from '../http/controllers/comment.controller';

import { ServiceSecretGuard, JwtAuthGuard } from '../http/guards';
import { LoggingInterceptor } from '../http/interceptors/logging.interceptor';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';
import { AllExceptionsFilter } from '../http/filters/all-exceptions.filter';
import { JwtStrategy } from '../http/strategies';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>(JWT_SECRET_KEY);
        if (!secret) {
          throw new Error('JWT_SECRET_KEY is not configured');
        }
        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
    Neo4jModule,
    RedisModule,
    EngagementMongoModule,
  ],
  controllers: [
    LikeController,
    FollowerController,
    CommentController,
  ],
  providers: [
    // Repositories
    {
      provide: LIKE_REPOSITORY,
      useClass: Neo4jLikeRepository,
    },
    {
      provide: FOLLOWER_REPOSITORY,
      useClass: Neo4jFollowerRepository,
    },
    {
      provide: COMMENT_REPOSITORY,
      useClass: MongoDBCommentRepository,
    },

    // Use Cases
    ToggleLikeUseCase,
    GetLikeCountUseCase,
    HasUserLikedUseCase,
    GetUserLikedPublicationsUseCase,
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowersUseCase,
    GetFollowingUseCase,
    GetMutualFollowersUseCase,
    CreateCommentUseCase,
    GetCommentsUseCase,
    DeleteCommentUseCase,

    // Strategy
    JwtStrategy,

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ServiceSecretGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
