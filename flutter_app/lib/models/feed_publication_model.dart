class FeedPublication {
  final String id;
  final String restaurantId;
  final String restaurantName;
  final String? restaurantLogo;
  final List<String> imageUrls;
  final String title;
  final String description;
  final String? type;
  final double? price;
  final String publishedAt;
  final double? distanceKm;
  final String? cityName;
  final String? source;

  const FeedPublication({
    required this.id,
    required this.restaurantId,
    required this.restaurantName,
    this.restaurantLogo,
    this.imageUrls = const [],
    required this.title,
    required this.description,
    this.type,
    this.price,
    required this.publishedAt,
    this.distanceKm,
    this.cityName,
    this.source,
  });

  factory FeedPublication.fromJson(Map<String, dynamic> json) {
    final images = json['imageUrls'];
    return FeedPublication(
      id: (json['id'] ?? '').toString(),
      restaurantId: (json['restaurantId'] ?? '').toString(),
      restaurantName: (json['restaurantName'] ?? '').toString(),
      restaurantLogo: json['restaurantLogo']?.toString(),
      imageUrls: images is List ? images.whereType<String>().toList() : [],
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      type: json['type']?.toString(),
      price: (json['price'] as num?)?.toDouble(),
      publishedAt: (json['publishedAt'] ?? '').toString(),
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      cityName: json['cityName']?.toString(),
      source: json['source']?.toString(),
    );
  }
}

class FeedResponse {
  final List<FeedPublication> publications;
  final int? total;
  final int? page;
  final int? limit;

  const FeedResponse({this.publications = const [], this.total, this.page, this.limit});

  factory FeedResponse.fromJson(Map<String, dynamic> json) {
    final pubs = json['data'];
    return FeedResponse(
      publications: pubs is List
          ? pubs.whereType<Map<String, dynamic>>().map(FeedPublication.fromJson).toList()
          : [],
      total: (json['total'] as int?),
      page: (json['page'] as int?),
      limit: (json['limit'] as int?),
    );
  }
}
