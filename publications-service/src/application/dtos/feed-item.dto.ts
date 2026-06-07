export class FeedItemDto {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  title: string;
  description: string;
  type: string;
  price: number;
  imageUrls: string[];
  publishedAt: Date;
  distanceKm: number | null;
  cityName: string | null;
  source: 'nearby' | 'followed' | 'liked' | 'explore';
}
