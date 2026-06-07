import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../models/address_model.dart';
import '../../../models/restaurant_profile_model.dart';
import '../../../services/location_service.dart';
import '../../../services/restaurant_service.dart';
import '../../../core/onboarding_navigation.dart';
import '../../../services/customer_service.dart';
import '../../../services/delivery_service.dart';
import '../../../state/auth_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_dropdown_field.dart';
import '../../components/custom_text_field.dart';
import '../../components/primary_button.dart';
import '../../components/futuristic_background.dart';
import '../../components/app_logo.dart';

class RestaurantAddressPage extends ConsumerStatefulWidget {
  final bool isFromSettings;

  const RestaurantAddressPage({super.key, this.isFromSettings = false});

  @override
  ConsumerState<RestaurantAddressPage> createState() => _RestaurantAddressPageState();
}

class _RestaurantAddressPageState extends ConsumerState<RestaurantAddressPage> {
  final _addressController = TextEditingController();

  final MapController _mapController = MapController();
  Timer? _reverseDebounce;
  LatLng? _selectedLatLng;
  bool _isLoadingLocation = false;
  bool _isReverseGeocoding = false;
  bool _isSaving = false;

  List<Department> _departments = [];
  List<City> _cities = [];
  Department? _selectedDepartment;
  City? _selectedCity;
  bool _isLoadingDepartments = false;
  bool _isLoadingCities = false;
  String? _pendingCityId;

  void _onCancel() {
    if (widget.isFromSettings) {
      if (context.canPop()) context.pop();
      return;
    }
    OnboardingNavigation.confirmCancel(
      context,
      onConfirm: () async {
        await ref.read(authControllerProvider.notifier).logout();
        if (!mounted) return;
        await ref.read(authServiceProvider).clearClientType();
        if (!mounted) return;
        context.go('/');
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _loadDepartments();
    _initCurrentLocation();
  }

  @override
  void dispose() {
    _reverseDebounce?.cancel();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    setState(() => _isLoadingDepartments = true);
    try {
      final departments = await ref.read(locationServiceProvider).fetchDepartments();
      if (mounted) setState(() => _departments = departments);
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) setState(() => _isLoadingDepartments = false);
    }
  }

  Future<void> _loadCities(String departmentId) async {
    setState(() {
      _isLoadingCities = true;
      _cities = [];
      _selectedCity = null;
    });
    try {
      final cities = await ref.read(locationServiceProvider).fetchCitiesByDepartment(departmentId);
      if (mounted) setState(() => _cities = cities);
      if (mounted) await _applyPendingCitySelection();
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) setState(() => _isLoadingCities = false);
    }
  }

  Future<void> _initCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      final permissionGranted = await _ensureLocationPermission();
      if (!permissionGranted) {
        _setFallbackLocation();
        return;
      }
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      final latLng = LatLng(position.latitude, position.longitude);
      await _updateSelectedLocation(latLng, shouldReverseGeocode: true);
      _moveCamera(latLng);
    } catch (_) {
      _setFallbackLocation();
    } finally {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  void _setFallbackLocation() {
    if (mounted) setState(() => _selectedLatLng = const LatLng(0, 0));
  }

  Future<bool> _ensureLocationPermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      _showSnack('Activa el servicio de ubicación para continuar');
      return false;
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      _showSnack('Permiso de ubicación denegado');
      return false;
    }
    return true;
  }

  void _moveCamera(LatLng latLng) => _mapController.move(latLng, 16);

  Future<void> _updateSelectedLocation(LatLng latLng, {required bool shouldReverseGeocode}) async {
    setState(() => _selectedLatLng = latLng);
    if (!shouldReverseGeocode) return;
    await _reverseGeocode(latLng);
  }

  Future<void> _reverseGeocode(LatLng latLng) async {
    setState(() => _isReverseGeocoding = true);
    try {
      final result = await ref.read(locationServiceProvider).reverseGeocode(
            latitude: latLng.latitude,
            longitude: latLng.longitude,
          );
      if (!mounted) return;
      if (result.mainAddress != null && result.mainAddress!.isNotEmpty) {
        _addressController.text = result.mainAddress!;
      }
      if (result.cityId != null && result.cityId!.isNotEmpty) {
        _pendingCityId = result.cityId;
        await _applyPendingCitySelection();
      }
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) setState(() => _isReverseGeocoding = false);
    }
  }

  void _scheduleReverseGeocode(LatLng latLng) {
    _reverseDebounce?.cancel();
    _reverseDebounce = Timer(const Duration(milliseconds: 700), () {
      if (mounted) _reverseGeocode(latLng);
    });
  }

  Future<void> _applyPendingCitySelection() async {
    if (_pendingCityId == null) return;
    final pendingId = _pendingCityId!;
    final match = _cities.where((city) => city.id == pendingId).toList();
    if (match.isNotEmpty) {
      setState(() {
        _selectedCity = match.first;
        _pendingCityId = null;
      });
      return;
    }
    try {
      final city = await ref.read(locationServiceProvider).fetchCityById(pendingId);
      if (!mounted) return;
      if (city.departmentId != null && city.departmentId!.isNotEmpty) {
        final dept = _departments.where((d) => d.id == city.departmentId).toList();
        if (dept.isNotEmpty) {
          setState(() => _selectedDepartment = dept.first);
          await _loadCities(city.departmentId!);
        }
      }
      if (!mounted) return;
      final finalMatch = _cities.where((item) => item.id == pendingId).toList();
      if (finalMatch.isNotEmpty) {
        setState(() {
          _selectedCity = finalMatch.first;
          _pendingCityId = null;
        });
      }
    } on LocationServiceException {
      // city lookup failed silently
    }
  }

  bool _validateForm() {
    final errors = <String>[];
    if (_addressController.text.trim().isEmpty) errors.add('Ingresa la dirección');
    if (_selectedCity == null) errors.add('Selecciona una ciudad');
    if (_selectedLatLng == null) errors.add('Selecciona una ubicación en el mapa');
    if (errors.isNotEmpty) {
      _showSnack(errors.join('\n'));
      return false;
    }
    return true;
  }

  Future<void> _submit() async {
    if (_isSaving) return;
    if (!_validateForm()) return;

    final latLng = _selectedLatLng;
    if (latLng == null || _selectedCity == null) return;

    setState(() => _isSaving = true);

    final payload = RestaurantAddressPayload(
      address: _addressController.text.trim(),
      cityId: _selectedCity!.id,
      latitude: latLng.latitude,
      longitude: latLng.longitude,
    );

    try {
      await ref.read(restaurantServiceProvider).updateAddress(payload);
      if (!mounted) return;

      if (widget.isFromSettings) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Dirección actualizada')),
          );
          if (context.canPop()) context.pop();
        }
        return;
      }

      await ref.read(authServiceProvider).fetchMe();

      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: null,
        customerService: ref.read(customerServiceProvider),
        authService: ref.read(authServiceProvider),
        deliveryService: ref.read(deliveryServiceProvider),
        restaurantService: ref.read(restaurantServiceProvider),
      );

      if (mounted) context.go(route);
    } on RestaurantProfileException catch (e) {
      if (mounted) _showSnack(e.message);
    } catch (_) {
      if (mounted) _showSnack('Ocurrió un error, intenta nuevamente');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _onMapTap(TapPosition tp, LatLng point) {
    _updateSelectedLocation(point, shouldReverseGeocode: false);
    _moveCamera(point);
    _scheduleReverseGeocode(point);
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final mapHeight = AppSpacing.huge * 3.5;
    final latLng = _selectedLatLng ?? const LatLng(4.5709, -74.2973);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: _onCancel,
        ),
      ),
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Center(child: AppLogo(size: 50)),
                const SizedBox(height: 12),
                Text(
                  'Ubicación del Restaurante',
                  style: AppTypography.headlineMedium.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 22,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Selecciona la ubicación en el mapa',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    height: mapHeight,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.cardOutline.withValues(alpha: 0.4)),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: _isLoadingLocation && _selectedLatLng == null
                        ? const Center(
                            child: CircularProgressIndicator(color: AppColors.primary),
                          )
                        : FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter: latLng,
                              initialZoom: 15,
                              onTap: _onMapTap,
                              onPositionChanged: (pos, hasGesture) {
                                if (hasGesture) {
                                  _scheduleReverseGeocode(pos.center);
                                }
                              },
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                                subdomains: const ['a', 'b', 'c', 'd'],
                                userAgentPackageName: 'com.example.flutter_app',
                              ),
                              MarkerLayer(
                                markers: [
                                  if (_selectedLatLng != null)
                                    Marker(
                                      point: _selectedLatLng!,
                                      width: 40,
                                      height: 40,
                                      child: const Icon(
                                        Icons.store,
                                        color: AppColors.accent,
                                        size: 32,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: AppSpacing.s),
                OutlinedButton.icon(
                  onPressed: _isLoadingLocation ? null : _initCurrentLocation,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textPrimary,
                    side: BorderSide(color: AppColors.cardOutline.withValues(alpha: 0.4)),
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  icon: const Icon(Icons.my_location, size: 18),
                  label: Text(
                    'Usar mi ubicación actual',
                    style: AppTypography.labelLarge.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (_isReverseGeocoding)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Buscando dirección...',
                      style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                const SizedBox(height: AppSpacing.l),
                CustomTextField(
                  label: 'Dirección',
                  controller: _addressController,
                  hintText: 'Calle 85 #15-20',
                ),
                const SizedBox(height: AppSpacing.m),
                CustomDropdownField(
                  label: 'Departamento',
                  value: _selectedDepartment?.id,
                  items: _departments.map((d) => d.id).toList(),
                  itemLabelBuilder: (v) {
                    final match = _departments.where((d) => d.id == v).toList();
                    return match.isEmpty ? v : match.first.name;
                  },
                  hintText: _isLoadingDepartments ? 'Cargando...' : 'Selecciona',
                  onChanged: _isLoadingDepartments
                      ? null
                      : (v) {
                          final dept = _departments.where((d) => d.id == v).toList();
                          if (dept.isEmpty) return;
                          setState(() => _selectedDepartment = dept.first);
                          _loadCities(dept.first.id);
                        },
                ),
                const SizedBox(height: AppSpacing.m),
                CustomDropdownField(
                  label: 'Ciudad',
                  value: _selectedCity?.id,
                  items: _cities.map((c) => c.id).toList(),
                  itemLabelBuilder: (v) {
                    final match = _cities.where((c) => c.id == v).toList();
                    return match.isEmpty ? v : match.first.name;
                  },
                  hintText: _isLoadingCities ? 'Cargando...' : 'Selecciona',
                  onChanged: _isLoadingCities || _cities.isEmpty
                      ? null
                      : (v) {
                          final city = _cities.where((c) => c.id == v).toList();
                          if (city.isEmpty) return;
                          setState(() => _selectedCity = city.first);
                        },
                ),
                const SizedBox(height: AppSpacing.xl),
                PrimaryButton(
                  label: 'Guardar ubicación',
                  onPressed: _submit,
                  isLoading: _isSaving,
                ),
                const SizedBox(height: AppSpacing.l),
              ],
            ),
          ),
        ),
    );
  }
}

