import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EngagementClient {
  private readonly logger = new Logger('EngagementClient');
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('ENGAGEMENT_SERVICE_URL') || 'http://localhost:5566';
  }

  async getFollowing(userId: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ following: { id: string; userId: string; createdAt: string }[]; count: number }>(
          `${this.baseUrl}/followers/following/${userId}`,
          {
            headers: {
              'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
              'x-user-id': userId,
              'x-user-role': 'CUSTOMER',
            },
          },
        ),
      );
      return response.data.following.map(f => f.userId);
    } catch (error: any) {
      this.logger.warn(`Failed to fetch following for user ${userId}: ${error.message}`);
      return [];
    }
  }

  async getPublicationsLikedByUser(userId: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ publicationIds: string[] }>(
          `${this.baseUrl}/likes/user/${userId}/publications`,
          {
            headers: {
              'x-service-secret': this.configService.get<string>('SERVICE_SECRET') || '',
              'x-user-id': userId,
              'x-user-role': 'CUSTOMER',
            },
          },
        ),
      );
      return response.data.publicationIds;
    } catch (error: any) {
      this.logger.warn(`Failed to fetch liked publications for user ${userId}: ${error.message}`);
      return [];
    }
  }
}
