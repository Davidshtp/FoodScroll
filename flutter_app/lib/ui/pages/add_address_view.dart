import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/address_model.dart';
import '../../services/address_service.dart';
import '../../services/delivery_service.dart';
import '../../services/restaurant_service.dart';
import '../../core/onboarding_navigation.dart';
import '../../models/user_model.dart';
import '../../services/customer_service.dart';
import '../../services/location_service.dart';
import '../../services/storage_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import '../components/custom_dropdown_field.dart';
import '../components/custom_text_field.dart';
import '../components/futuristic_background.dart';
import '../components/primary_button.dart';
import '../layouts/add_address_layout.dart';
import '../../state/auth_provider.dart';

class AddAddressView extends ConsumerStatefulWidget {
  final bool isFromProfile;

  const AddAddressView({super.key, this.isFromProfile = false});

  @override
  ConsumerState<AddAddressView> createState() => _AddAddressViewState();
}

class _AddAddressViewState extends ConsumerState<AddAddressView> {
  final _aliasController = TextEditingController();
  final _mainAddressController = TextEditingController();
  final _neighborhoodController = TextEditingController();
  final _detailsController = TextEditingController();

  final MapController _mapController = MapController();
  Timer? _reverseDebounce;
  LatLng? _selectedLatLng;
  bool _isLoadingLocation = false;
  bool _isReverseGeocoding = false;

  void _onCancel() {
    if (widget.isFromProfile) {
      Navigator.pop(context);
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
  bool _isSaving = false;

  List<Department> _departments = [];
  List<City> _cities = [];
  Department? _selectedDepartment;
  City? _selectedCity;
  bool _isLoadingDepartments = false;
  bool _isLoadingCities = false;
  String? _pendingCityId;

  Map<String, String> _errors = {};

  @override
  void initState() {
    super.initState();
    _loadDepartments();
    _initCurrentLocation();
  }

  @override
  void dispose() {
    _reverseDebounce?.cancel();
    _aliasController.dispose();
    _mainAddressController.dispose();
    _neighborhoodController.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _loadDepartments() async {
    setState(() {
      _isLoadingDepartments = true;
    });

    try {
      final service = ref.read(locationServiceProvider);
      final departments = await service.fetchDepartments();
      if (!mounted) {
        return;
      }
      setState(() {
        _departments = departments;
      });
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingDepartments = false;
        });
      }
    }
  }

  Future<void> _loadCities(String departmentId) async {
    setState(() {
      _isLoadingCities = true;
      _cities = [];
      _selectedCity = null;
    });

    try {
      final service = ref.read(locationServiceProvider);
      final cities = await service.fetchCitiesByDepartment(departmentId);
      if (!mounted) {
        return;
      }
      setState(() {
        _cities = cities;
      });
      await _applyPendingCitySelection();
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingCities = false;
        });
      }
    }
  }

  Future<void> _initCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      final permissionGranted = await _ensureLocationPermission();
      if (!permissionGranted) {
        _setFallbackLocation();
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      final latLng = LatLng(position.latitude, position.longitude);
      await _updateSelectedLocation(latLng, shouldReverseGeocode: true);
      _moveCamera(latLng);
    } catch (_) {
      _setFallbackLocation();
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingLocation = false;
        });
      }
    }
  }

  void _setFallbackLocation() {
    if (!mounted) {
      return;
    }
    setState(() {
      _selectedLatLng = const LatLng(0, 0);
    });
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showSnack('Activa el servicio de ubicacion para continuar');
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _showSnack('Permiso de ubicacion denegado');
      return false;
    }
    return true;
  }

  Future<void> _moveToCurrentLocation() async {
    await _initCurrentLocation();
  }

  void _moveCamera(LatLng latLng) {
    _mapController.move(latLng, 16);
  }

  Future<void> _updateSelectedLocation(
    LatLng latLng, {
    required bool shouldReverseGeocode,
  }) async {
    setState(() {
      _selectedLatLng = latLng;
      _errors.remove('location');
    });

    if (!shouldReverseGeocode) {
      return;
    }

    await _reverseGeocode(latLng);
  }

  Future<void> _reverseGeocode(LatLng latLng) async {
    setState(() {
      _isReverseGeocoding = true;
    });

    try {
      final service = ref.read(locationServiceProvider);
      final result = await service.reverseGeocode(
        latitude: latLng.latitude,
        longitude: latLng.longitude,
      );
      if (!mounted) {
        return;
      }
      if (result.mainAddress != null && result.mainAddress!.isNotEmpty) {
        _mainAddressController.text = result.mainAddress!;
        _errors.remove('mainAddress');
      }
      if (result.cityId != null && result.cityId!.isNotEmpty) {
        _pendingCityId = result.cityId;
        await _applyPendingCitySelection();
      }
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    } finally {
      if (mounted) {
        setState(() {
          _isReverseGeocoding = false;
        });
      }
    }
  }

  void _scheduleReverseGeocode(LatLng latLng) {
    _reverseDebounce?.cancel();
    _reverseDebounce = Timer(const Duration(milliseconds: 700), () {
      if (!mounted) {
        return;
      }
      _reverseGeocode(latLng);
    });
  }

  Future<void> _applyPendingCitySelection() async {
    if (_pendingCityId == null) {
      return;
    }

    final pendingId = _pendingCityId!;
    final match = _cities.where((city) => city.id == pendingId).toList();
    if (match.isNotEmpty) {
      setState(() {
        _selectedCity = match.first;
        _pendingCityId = null;
        _errors.remove('city');
      });
      return;
    }

    try {
      final locationService = ref.read(locationServiceProvider);
      final city = await locationService.fetchCityById(pendingId);
      if (!mounted) {
        return;
      }

      if (city.departmentId != null && city.departmentId!.isNotEmpty) {
        final department = _departments
            .where((item) => item.id == city.departmentId)
            .toList();
        if (department.isNotEmpty) {
          setState(() {
            _selectedDepartment = department.first;
          });
          await _loadCities(city.departmentId!);
        }
      }

      if (!mounted) {
        return;
      }

      final cityMatch = _cities.where((item) => item.id == pendingId).toList();
      if (cityMatch.isNotEmpty) {
        setState(() {
          _selectedCity = cityMatch.first;
          _pendingCityId = null;
          _errors.remove('city');
        });
      }
    } on LocationServiceException catch (e) {
      _showSnack(e.message);
    }
  }

  bool _validateForm() {
    final errors = <String, String>{};

    if (_aliasController.text.trim().isEmpty) {
      errors['alias'] = 'Ingresa un alias';
    }

    if (_mainAddressController.text.trim().isEmpty) {
      errors['mainAddress'] = 'Ingresa la direccion principal';
    }

    if (_neighborhoodController.text.trim().isEmpty) {
      errors['neighborhood'] = 'Ingresa el barrio';
    }

    if (_selectedCity == null) {
      errors['city'] = 'Selecciona una ciudad';
    }

    if (_selectedLatLng == null) {
      errors['location'] = 'Selecciona una ubicacion en el mapa';
    }

    setState(() {
      _errors = errors;
    });

    return errors.isEmpty;
  }

  Future<void> _submit() async {
    if (_isSaving) {
      return;
    }

    if (!_validateForm()) {
      _showSnack('Revisa los campos marcados');
      return;
    }

    final latLng = _selectedLatLng;
    if (latLng == null || _selectedCity == null) {
      _showSnack('Selecciona una ciudad y una ubicacion');
      return;
    }

    setState(() {
      _isSaving = true;
    });

    final payload = AddressPayload(
      alias: _aliasController.text.trim(),
      cityId: _selectedCity!.id,
      details: _detailsController.text.trim(),
      latitude: latLng.latitude,
      longitude: latLng.longitude,
      mainAddress: _mainAddressController.text.trim(),
      neighborhood: _neighborhoodController.text.trim(),
    );

    try {
      final service = ref.read(addressServiceProvider);
      await service.createAddress(payload);
      if (!mounted) {
        return;
      }
      await _navigateAfterAddress();
    } on AddressServiceException catch (e) {
      if (!mounted) {
        return;
      }
      if (e.statusCode == 401) {
        await ref.read(authServiceProvider).logout();
        if (!mounted) {
          return;
        }
        context.go('/login');
        return;
      }
      _showSnack(e.message);
    } catch (_) {
      if (mounted) {
        _showSnack('Ocurrió un error, intenta nuevamente');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  void _onMapTap(LatLng latLng) {
    _updateSelectedLocation(latLng, shouldReverseGeocode: false);
    _moveCamera(latLng);
    _scheduleReverseGeocode(latLng);
  }

  void _onMapMoved(LatLng center) {
    _updateSelectedLocation(center, shouldReverseGeocode: false);
    _scheduleReverseGeocode(center);
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _navigateAfterAddress() async {
    if (widget.isFromProfile) {
      if (mounted) Navigator.pop(context);
      return;
    }

    final authService = ref.read(authServiceProvider);
    final customerService = ref.read(customerServiceProvider);
    final deliveryService = ref.read(deliveryServiceProvider);
    final restaurantService = ref.read(restaurantServiceProvider);
    final storage = StorageService();

    try {
      await authService.fetchMe();
      final userData = await storage.getUser();
      final user = userData != null ? AuthUser.fromJson(userData) : null;

      if (!mounted) return;

      final route = await OnboardingNavigation.resolvePostAuthRoute(
        user: user,
        customerService: customerService,
        authService: authService,
        deliveryService: deliveryService,
        restaurantService: restaurantService,
      );

      if (!mounted) return;

      if (route == '/home') {
        context.go('/home');
        return;
      }

      _showSnack('Completa los pasos pendientes para continuar');
    } on CustomerProfileException catch (e) {
      if (!mounted) return;
      if (e.statusCode == 401) {
        await authService.logout();
        if (!mounted) return;
        context.go('/login');
        return;
      }
      if (e.statusCode == 404) {
        _showSnack('Perfil no encontrado');
        return;
      }
      _showSnack(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mapHeight = AppSpacing.huge * 4;
    final latLng = _selectedLatLng ?? const LatLng(0, 0);

    final formContent = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          child: Container(
            height: mapHeight,
            decoration: BoxDecoration(
              border: Border.all(
                color: AppColors.cardOutline.withValues(alpha: 0.4),
              ),
              borderRadius: BorderRadius.circular(AppRadius.xl),
            ),
            child: _isLoadingLocation && _selectedLatLng == null
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                    ),
                  )
                : FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: latLng,
                      initialZoom: 15,
                      onTap: (tapPosition, point) => _onMapTap(point),
                      onPositionChanged: (position, hasGesture) {
                        if (!hasGesture) {
                          return;
                        }
                        _onMapMoved(position.center);
                      },
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
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
                                Icons.location_on,
                                color: AppColors.primary,
                                size: 36,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
          ),
        ),
        if (_errors['location'] != null) ...[
          const SizedBox(height: AppSpacing.s),
          Text(
            _errors['location']!,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.error),
          ),
        ],
        const SizedBox(height: AppSpacing.m),
        OutlinedButton.icon(
          onPressed: _isLoadingLocation ? null : _moveToCurrentLocation,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            side: BorderSide(color: AppColors.cardOutline.withValues(alpha: 0.4)),
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.xl),
            ),
          ),
          icon: const Icon(Icons.my_location, size: 18),
          label: Text(
            'Usar mi ubicacion actual',
            style: AppTypography.labelLarge.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        if (_isReverseGeocoding) ...[
          const SizedBox(height: AppSpacing.s),
          Text(
            'Buscando direccion...',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Alias',
          controller: _aliasController,
          hintText: 'Casa, trabajo, etc',
          errorText: _errors['alias'],
        ),
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Direccion principal',
          controller: _mainAddressController,
          hintText: 'Av. Principal 123',
          errorText: _errors['mainAddress'],
        ),
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Barrio',
          controller: _neighborhoodController,
          hintText: 'El Poblado',
          errorText: _errors['neighborhood'],
        ),
        const SizedBox(height: AppSpacing.l),
        CustomTextField(
          label: 'Detalles',
          controller: _detailsController,
          hintText: 'Apto 502',
        ),
        const SizedBox(height: AppSpacing.l),
        CustomDropdownField(
          label: 'Departamento',
          value: _selectedDepartment?.id,
          items: _departments.map((item) => item.id).toList(),
          itemLabelBuilder: (value) {
            final match = _departments
                .where((item) => item.id == value)
                .toList();
            return match.isEmpty ? value : match.first.name;
          },
          hintText: _isLoadingDepartments
              ? 'Cargando departamentos...'
              : 'Selecciona un departamento',
          onChanged: _isLoadingDepartments
              ? null
              : (value) {
                  final department = _departments
                      .where((item) => item.id == value)
                      .toList();
                  if (department.isEmpty) {
                    return;
                  }
                  setState(() {
                    _selectedDepartment = department.first;
                    _errors.remove('department');
                  });
                  _loadCities(department.first.id);
                },
        ),
        const SizedBox(height: AppSpacing.l),
        CustomDropdownField(
          label: 'Ciudad',
          value: _selectedCity?.id,
          items: _cities.map((item) => item.id).toList(),
          itemLabelBuilder: (value) {
            final match = _cities.where((item) => item.id == value).toList();
            return match.isEmpty ? value : match.first.name;
          },
          hintText: _isLoadingCities
              ? 'Cargando ciudades...'
              : 'Selecciona una ciudad',
          errorText: _errors['city'],
          onChanged: _isLoadingCities || _cities.isEmpty
              ? null
              : (value) {
                  final city = _cities
                      .where((item) => item.id == value)
                      .toList();
                  if (city.isEmpty) {
                    return;
                  }
                  setState(() {
                    _selectedCity = city.first;
                    _errors.remove('city');
                  });
                },
        ),
      ],
    );

    if (widget.isFromProfile) {
      return Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: FuturisticBackground(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 24),
                    Text(
                      'Añadir dirección',
                      style: AppTypography.headlineMedium.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Ingresa los datos de tu nueva dirección',
                      style: AppTypography.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.l),
                    formContent,
                    const SizedBox(height: AppSpacing.xl),
                    PrimaryButton(
                      label: 'Guardar direccion',
                      onPressed: _submit,
                      isLoading: _isSaving,
                    ),
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return AddAddressLayout(
      title: 'Configura tu ubicacion',
      subtitle: 'Necesitamos tu direccion principal para continuar.',
      content: formContent,
      onCancel: _onCancel,
      primaryAction: PrimaryButton(
        label: 'Guardar direccion',
        onPressed: _submit,
        isLoading: _isSaving,
      ),
    );
  }
}