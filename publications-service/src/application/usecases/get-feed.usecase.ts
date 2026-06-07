import { Injectable, Logger, Inject } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { RestaurantNearbyClient } from '../../infrastructure/http/restaurant-nearby-client.service';
import { RestaurantInfoClient } from '../../infrastructure/http/restaurant-info-client.service';
import { EngagementClient } from '../../infrastructure/http/engagement-client.service';
import { LocationClient } from '../../infrastructure/http/location-client.service';
import { FeedItemDto } from '../dtos/feed-item.dto';

interface FeedOptions {
  userId: string;
  page: number;
  limit: number;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class GetFeedUseCase {
  private readonly logger = new Logger('GetFeedUseCase');

  constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly publicationRepo: PublicationRepositoryPort,
    private readonly restaurantNearbyClient: RestaurantNearbyClient,
    private readonly restaurantInfoClient: RestaurantInfoClient,
    private readonly engagementClient: EngagementClient,
    private readonly locationClient: LocationClient,
  ) {}

  async execute(options: FeedOptions): Promise<{ data: FeedItemDto[]; total: number; page: number; limit: number }> {
    const { userId, latitude, longitude } = options;
    const page = Math.max(1, options.page);
    const limit = Math.min(50, Math.max(1, options.limit));

    const allItems: FeedItemDto[] = [];
    const seenIds = new Set<string>();

    const restaurantCache = new Map<string, { name: string; logo: string }>();

    const getRestaurantInfo = async (restaurantId: string): Promise<{ name: string; logo: string }> => {
      if (restaurantCache.has(restaurantId)) {
        return restaurantCache.get(restaurantId)!;
      }
      const info = await this.restaurantInfoClient.getRestaurantInfo(restaurantId);
      const result = {
        name: info.restaurant.name,
        logo: info.restaurant.logoUrl,
      };
      restaurantCache.set(restaurantId, result);
      return result;
    };

    if (latitude !== undefined && longitude !== undefined) {
      try {
        const nearbyRestaurants = await this.restaurantNearbyClient.findNearby(latitude, longitude);
        if (nearbyRestaurants.length > 0) {
          const nearbyIds = nearbyRestaurants.map(r => r.restaurantId);
          const distanceMap = new Map(nearbyRestaurants.map(r => [r.restaurantId, r.distanceKm]));
          const nameMap = new Map(nearbyRestaurants.map(r => [r.restaurantId, r.name]));
          const logoMap = new Map(nearbyRestaurants.map(r => [r.restaurantId, r.logoUrl]));

          const publications = await this.publicationRepo.findByRestaurantIds(nearbyIds);

          for (const pub of publications) {
            const pubId = pub.getId();
            if (seenIds.has(pubId)) continue;
            seenIds.add(pubId);

            const restId = pub.getRestaurantId();
            allItems.push({
              id: pubId,
              restaurantId: restId,
              restaurantName: nameMap.get(restId) || 'Unknown',
              restaurantLogo: logoMap.get(restId) || '',
              title: pub.getTitle(),
              description: pub.getDescription(),
              type: pub.getType(),
              price: pub.getPrice(),
              imageUrls: pub.getImageUrls(),
              publishedAt: pub.getPublishedAt(),
              distanceKm: distanceMap.get(restId) || null,
              cityName: null,
              source: 'nearby',
            });
          }
        }
      } catch (error: any) {
        this.logger.warn(`Nearby feed source failed: ${error.message}`);
      }
    }

    let followedUserIds: string[] = [];
    try {
      followedUserIds = await this.engagementClient.getFollowing(userId);
    } catch (error: any) {
      this.logger.warn(`Failed to fetch following for feed: ${error.message}`);
    }

    if (followedUserIds.length > 0) {
      try {
        const restaurants = await this.restaurantInfoClient.findByUserIds(followedUserIds);
        const followedRestaurantIds = restaurants.map(r => r.id);

        if (followedRestaurantIds.length > 0) {
          const allPublications = await this.publicationRepo.findByRestaurantIds(followedRestaurantIds);

          for (const pub of allPublications) {
            const pubId = pub.getId();
            if (seenIds.has(pubId)) continue;
            seenIds.add(pubId);

            const restId = pub.getRestaurantId();
            const info = await getRestaurantInfo(restId);
            allItems.push({
              id: pubId,
              restaurantId: restId,
              restaurantName: info.name,
              restaurantLogo: info.logo,
              title: pub.getTitle(),
              description: pub.getDescription(),
              type: pub.getType(),
              price: pub.getPrice(),
              imageUrls: pub.getImageUrls(),
              publishedAt: pub.getPublishedAt(),
              distanceKm: null,
              cityName: null,
              source: 'followed',
            });
          }
        }
      } catch (error: any) {
        this.logger.warn(`Followed restaurants feed source failed: ${error.message}`);
      }

      try {
        for (const followedUserId of followedUserIds) {
          const likedPubIds = await this.engagementClient.getPublicationsLikedByUser(followedUserId);
          if (likedPubIds.length > 0) {
            const publications = await this.publicationRepo.findByIds(likedPubIds);

            for (const pub of publications) {
              const pubId = pub.getId();
              if (seenIds.has(pubId)) continue;
              seenIds.add(pubId);

              const restId = pub.getRestaurantId();
              const info = await getRestaurantInfo(restId);
              allItems.push({
                id: pubId,
                restaurantId: restId,
                restaurantName: info.name,
                restaurantLogo: info.logo,
                title: pub.getTitle(),
                description: pub.getDescription(),
                type: pub.getType(),
                price: pub.getPrice(),
                imageUrls: pub.getImageUrls(),
                publishedAt: pub.getPublishedAt(),
              distanceKm: null,
              cityName: null,
              source: 'liked',
              });
            }
          }
        }
      } catch (error: any) {
        this.logger.warn(`[FEED] Liked by followed users feed source failed: ${error.message}`);
      }
    }

    const restaurantIdsInFeed = [...new Set(allItems.map(i => i.restaurantId))];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      const explorePubs = await this.publicationRepo.findRecentActive(
        sevenDaysAgo,
        50,
        restaurantIdsInFeed.length > 0 ? restaurantIdsInFeed : undefined,
      );

      for (const pub of explorePubs) {
        const pubId = pub.getId();
        if (seenIds.has(pubId)) continue;
        seenIds.add(pubId);
        const restId = pub.getRestaurantId();
        const info = await getRestaurantInfo(restId);
        allItems.push({
          id: pubId,
          restaurantId: restId,
          restaurantName: info.name,
          restaurantLogo: info.logo,
          title: pub.getTitle(),
          description: pub.getDescription(),
          type: pub.getType(),
          price: pub.getPrice(),
          imageUrls: pub.getImageUrls(),
          publishedAt: pub.getPublishedAt(),
          distanceKm: null,
          cityName: null,
          source: 'explore',
        });
      }
    } catch (error: any) {
      this.logger.warn(`Explore feed source failed: ${error.message}`);
    }

    const allRestaurantIds = [...new Set(allItems.map(i => i.restaurantId))];
    if (allRestaurantIds.length > 0) {
      try {
        const addressMap = await this.restaurantInfoClient.getAddressesByRestaurantIds(allRestaurantIds);

        if (latitude !== undefined && longitude !== undefined) {
          for (const item of allItems) {
            if (item.distanceKm !== null) continue;
            const addr = addressMap.get(item.restaurantId);
            if (addr) {
              item.distanceKm = haversine(latitude, longitude, addr.latitude, addr.longitude);
            }
          }
        }

        const cityIds = [...new Set([...addressMap.values()].map(a => a.cityId).filter(Boolean))];
        if (cityIds.length > 0) {
          const cityMap = await this.locationClient.getCityNames(cityIds);
          for (const item of allItems) {
            const addr = addressMap.get(item.restaurantId);
            if (addr && cityMap.has(addr.cityId)) {
              item.cityName = cityMap.get(addr.cityId)!;
            }
          }
        }
      } catch (error: any) {
        this.logger.warn(`Feed enrichment failed: ${error.message}`);
      }
    }

    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const total = allItems.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
    };
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}
