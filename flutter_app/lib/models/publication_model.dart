class RestaurantPublication {
  final String id;
  final String restaurantId;
  final String title;
  final String description;
  final String? type;
  final List<String> imageUrls;
  final double? price;
  final String? publishedAt;
  final String? deletedAt;

  const RestaurantPublication({
    required this.id,
    required this.restaurantId,
    required this.title,
    required this.description,
    this.type,
    this.imageUrls = const [],
    this.price,
    this.publishedAt,
    this.deletedAt,
  });

  factory RestaurantPublication.fromJson(Map<String, dynamic> json) {
    final typeRaw = json['type'];
    String? typeValue;
    if (typeRaw is Map<String, dynamic>) {
      typeValue = typeRaw['value']?.toString();
    } else if (typeRaw != null) {
      typeValue = typeRaw.toString();
    }

    final priceRaw = json['price'];
    double? priceValue;
    if (priceRaw is num) {
      priceValue = priceRaw.toDouble();
    } else if (priceRaw != null) {
      priceValue = double.tryParse(priceRaw.toString());
    }

    final images = json['imageUrls'];
    final imageList = images is List
        ? images.whereType<String>().toList()
        : <String>[];

    return RestaurantPublication(
      id: (json['id'] ?? '').toString(),
      restaurantId: (json['restaurantId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      type: typeValue,
      imageUrls: imageList,
      price: priceValue,
      publishedAt: json['publishedAt']?.toString(),
      deletedAt: json['deletedAt']?.toString(),
    );
  }
}

class CreatePublicationPayload {
  final String title;
  final String description;
  final String type;
  final String price;

  const CreatePublicationPayload({
    required this.title,
    required this.description,
    required this.type,
    required this.price,
  });

  Map<String, String> toJson() => {
        'title': title,
        'description': description,
        'type': type,
        'price': price,
      };
}

class UpdatePublicationPayload {
  final String? title;
  final String? description;
  final String? type;
  final String? price;
  final List<String>? imageUrlsToDelete;

  const UpdatePublicationPayload({
    this.title,
    this.description,
    this.type,
    this.price,
    this.imageUrlsToDelete,
  });
}
