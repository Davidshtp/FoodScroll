import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/address_model.dart';
import '../../services/address_service.dart';
import '../../services/storage_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import 'profile/customer_profile_page.dart';
import 'profile/delivery_profile_page.dart';
import 'profile/restaurant_profile_page.dart';
import 'profile/restaurant_settings_page.dart';
import 'restaurant/restaurant_home_page.dart';
import 'restaurant/publications_list_page.dart';
import 'restaurant/create_publication_page.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _selectedIndex = 0;
  String _role = 'customer';
  int _profileRefreshKey = 0;

  List<CustomerAddress> _addresses = [];
  CustomerAddress? _selectedAddress;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final storage = StorageService();
    final clientType = await storage.getClientType();

    if (mounted) {
      setState(() {
        _role = clientType ?? 'customer';
      });
    }

    if (clientType == 'customer') {
      await _loadAddresses();
    }
  }

  Future<void> _loadAddresses() async {
    try {
      final addresses = await AddressService().fetchAddresses();
      if (mounted) {
        setState(() {
          _addresses = addresses;
          if (_selectedAddress == null && addresses.isNotEmpty) {
            _selectedAddress = addresses.first;
          }
        });
      }
    } catch (_) {}
  }

  void _showLocationPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.textTertiary, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            Text('Seleccionar dirección', style: AppTypography.titleLarge),
            const SizedBox(height: 8),
            if (_addresses.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No hay direcciones guardadas', style: TextStyle(color: AppColors.textSecondary)),
              )
            else
              ..._addresses.map((addr) => ListTile(
                leading: const Icon(Icons.location_on, color: AppColors.primary),
                title: Text(addr.alias, style: AppTypography.bodyLarge),
                subtitle: Text('${addr.mainAddress}, ${addr.neighborhood}', style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
                trailing: _selectedAddress?.id == addr.id
                    ? const Icon(Icons.check_circle, color: AppColors.primary)
                    : null,
                onTap: () {
                  setState(() => _selectedAddress = addr);
                  Navigator.pop(ctx);
                },
              )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // --- Tabs for Customer ---
  List<Widget> get _customerTabs => [
    const _PlaceholderTab(icon: Icons.home_outlined, label: 'Inicio'),
    const _PlaceholderTab(icon: Icons.shopping_bag_outlined, label: 'Pedidos'),
    const _PlaceholderTab(icon: Icons.send_outlined, label: 'Chat'),
    const _PlaceholderTab(icon: Icons.search_outlined, label: 'Buscar'),
    CustomerProfilePage(onAddressesChanged: _loadAddresses),
  ];

  // --- Tabs for Delivery ---
  List<Widget> get _deliveryTabs => [
    const _PlaceholderTab(icon: Icons.home_outlined, label: 'Inicio'),
    const _PlaceholderTab(icon: Icons.map_outlined, label: 'Mapa'),
    const _PlaceholderTab(icon: Icons.two_wheeler_outlined, label: 'Pedidos'),
    const _PlaceholderTab(icon: Icons.send_outlined, label: 'Chat'),
    const DeliveryProfilePage(),
  ];

  // --- Tabs for Restaurant ---
  List<Widget> get _restaurantTabs => [
    const RestaurantHomePage(),
    const PublicationsListPage(),
    const CreatePublicationPage(),
    const _PlaceholderTab(icon: Icons.notifications_outlined, label: 'Notificaciones'),
    RestaurantProfilePage(key: ValueKey('profile_$_profileRefreshKey')),
  ];

  @override
  Widget build(BuildContext context) {
    final tabs = switch (_role) {
      'delivery' => _deliveryTabs,
      'restaurant' => _restaurantTabs,
      _ => _customerTabs,
    };

    final iconMap = switch (_role) {
      'delivery' => (
        outlined: [
          Icons.home_outlined,
          Icons.map_outlined,
          Icons.two_wheeler_outlined,
          Icons.send_outlined,
          Icons.person_outlined,
        ],
        filled: [
          Icons.home,
          Icons.map,
          Icons.two_wheeler,
          Icons.send,
          Icons.person,
        ],
      ),
      'restaurant' => (
        outlined: [
          Icons.inventory_2_outlined,
          Icons.menu_book_outlined,
          Icons.add_circle,
          Icons.notifications_outlined,
          Icons.person_outlined,
        ],
        filled: [
          Icons.inventory_2,
          Icons.menu_book,
          Icons.add_circle,
          Icons.notifications,
          Icons.person,
        ],
      ),
      _ => (
        outlined: [
          Icons.home_outlined,
          Icons.shopping_bag_outlined,
          Icons.send_outlined,
          Icons.search_outlined,
          Icons.person_outlined,
        ],
        filled: [
          Icons.home,
          Icons.shopping_bag,
          Icons.send,
          Icons.search,
          Icons.person,
        ],
      ),
    };

    return Scaffold(
      extendBody: true,
      appBar: _buildAppBar(),
      body: IndexedStack(
        index: _selectedIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.divider.withValues(alpha: 0.3)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          backgroundColor: AppColors.background,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textTertiary,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedIconTheme: const IconThemeData(size: 26),
          unselectedIconTheme: const IconThemeData(size: 24),
          showSelectedLabels: false,
          showUnselectedLabels: false,
          items: List.generate(iconMap.outlined.length, (i) {
            final isAdd = iconMap.outlined[i] == Icons.add_circle;
            return BottomNavigationBarItem(
              icon: isAdd
                  ? Container(
                      width: 44, height: 44,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFF3B30), Color(0xFFFF8C69)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, color: Colors.white, size: 22),
                    )
                  : Icon(i == _selectedIndex ? iconMap.filled[i] : iconMap.outlined[i]),
              activeIcon: isAdd
                  ? Container(
                      width: 44, height: 44,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFF3B30), Color(0xFFFF8C69)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add, color: Colors.white, size: 22),
                    )
                  : Icon(iconMap.filled[i]),
              label: '',
            );
          }),
        ),
      ),
    );
  }

  PreferredSizeWidget? _buildAppBar() {
    final foodScrollTitle = Text(
      'FoodScroll',
      style: GoogleFonts.dancingScript(
        fontSize: 22,
        color: Colors.white,
        fontWeight: FontWeight.w600,
      ),
    );

    Widget? leftWidget;
    late Widget rightWidget;

    switch (_role) {
      case 'delivery':
        rightWidget = IconButton(
          icon: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
          onPressed: () {},
        );
        break;
      case 'restaurant':
        rightWidget = IconButton(
          icon: const Icon(Icons.settings_outlined, color: AppColors.textPrimary),
          onPressed: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => const RestaurantSettingsPage()));
            if (mounted) setState(() => _profileRefreshKey++);
          },
        );
        break;
      default:
        if (_addresses.isNotEmpty) {
          leftWidget = GestureDetector(
            onTap: _showLocationPicker,
            child: Container(
              constraints: const BoxConstraints(maxWidth: 100),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      _selectedAddress != null
                          ? _selectedAddress!.alias
                          : 'Ubicación',
                      style: AppTypography.labelLarge.copyWith(fontSize: 12, color: AppColors.textPrimary),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.arrow_drop_down, color: AppColors.textTertiary, size: 18),
                ],
              ),
            ),
          );
        } else {
          leftWidget = const Padding(
            padding: EdgeInsets.only(left: 12),
            child: Icon(Icons.location_on, color: AppColors.primary, size: 20),
          );
        }
        rightWidget = IconButton(
          icon: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
          onPressed: () {},
        );
    }

    if (_role == 'customer') {
      return AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Expanded(
              flex: 1,
              child: Align(
                alignment: Alignment.centerLeft,
                child: leftWidget ?? const SizedBox.shrink(),
              ),
            ),
            foodScrollTitle,
            Expanded(
              flex: 1,
              child: Align(
                alignment: Alignment.centerRight,
                child: rightWidget,
              ),
            ),
          ],
        ),
      );
    }

    return AppBar(
      backgroundColor: AppColors.background,
      elevation: 0,
      automaticallyImplyLeading: false,
      title: Row(
        children: [
          const Spacer(),
          foodScrollTitle,
          const Spacer(),
          rightWidget,
        ],
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PlaceholderTab({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: AppColors.textTertiary.withValues(alpha: 0.3)),
          const SizedBox(height: AppSpacing.m),
          Text(
            label,
            style: AppTypography.titleMedium.copyWith(color: AppColors.textTertiary.withValues(alpha: 0.3)),
          ),
        ],
      ),
    );
  }
}
