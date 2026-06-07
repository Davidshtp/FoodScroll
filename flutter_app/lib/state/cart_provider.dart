import 'package:flutter_riverpod/flutter_riverpod.dart';

class CartItem {
  final String publicationId;
  final String restaurantId;
  final String restaurantName;
  final String title;
  final String? imageUrl;
  final double price;
  int quantity;

  CartItem({
    required this.publicationId,
    required this.restaurantId,
    required this.restaurantName,
    required this.title,
    this.imageUrl,
    required this.price,
    this.quantity = 1,
  });

  double get totalPrice => price * quantity;

  Map<String, dynamic> toOrderItem() => {
        'publicationId': publicationId,
        'quantity': quantity,
      };

  CartItem copyWith({int? quantity}) => CartItem(
        publicationId: publicationId,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        title: title,
        imageUrl: imageUrl,
        price: price,
        quantity: quantity ?? this.quantity,
      );
}

class CartNotifier extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() => [];

  void addItem(CartItem item) {
    final idx = state.indexWhere((i) => i.publicationId == item.publicationId);
    if (idx >= 0) {
      state = [
        for (int i = 0; i < state.length; i++)
          i == idx ? state[i].copyWith(quantity: state[i].quantity + 1) : state[i],
      ];
    } else {
      state = [...state, item];
    }
  }

  void removeItem(String publicationId) {
    state = state.where((i) => i.publicationId != publicationId).toList();
  }

  void updateQuantity(String publicationId, int quantity) {
    if (quantity <= 0) {
      removeItem(publicationId);
      return;
    }
    state = [
      for (final item in state)
        item.publicationId == publicationId ? item.copyWith(quantity: quantity) : item,
    ];
  }

  double get total => state.fold(0, (sum, item) => sum + item.totalPrice);

  int get itemCount => state.fold(0, (sum, item) => sum + item.quantity);

  bool get isEmpty => state.isEmpty;

  void clear() => state = [];

  Map<String, List<CartItem>> get itemsByRestaurant {
    final map = <String, List<CartItem>>{};
    for (final item in state) {
      map.putIfAbsent(item.restaurantId, () => []);
      map[item.restaurantId]!.add(item);
    }
    return map;
  }
}

final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);
