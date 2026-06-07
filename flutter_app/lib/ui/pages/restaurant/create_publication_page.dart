import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../models/publication_model.dart';
import '../../../services/publication_service.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/app_spacing.dart';
import '../../../theme/app_typography.dart';
import '../../components/custom_text_field.dart';
import '../../components/custom_dropdown_field.dart';
import '../../components/futuristic_background.dart';
import '../../components/primary_button.dart';

class CreatePublicationPage extends ConsumerStatefulWidget {
  final RestaurantPublication? publication;

  const CreatePublicationPage({super.key, this.publication});

  @override
  ConsumerState<CreatePublicationPage> createState() =>
      _CreatePublicationPageState();
}

class _CreatePublicationPageState extends ConsumerState<CreatePublicationPage> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

  String _selectedType = 'DISH';
  bool _isLoading = false;
  bool _isEditing = false;

  List<FilePayload> _newFiles = [];
  List<String> _existingImages = [];
  List<String> _imagesToDelete = [];

  final _types = ['DISH', 'PROMOTION', 'COMBO', 'BEVERAGE', 'DESSERT'];

  @override
  void initState() {
    super.initState();
    final pub = widget.publication;
    if (pub != null) {
      _isEditing = true;
      _titleController.text = pub.title;
      _descriptionController.text = pub.description;
      _priceController.text = pub.price?.toStringAsFixed(0) ?? '';
      _selectedType = pub.type ?? 'DISH';
      _existingImages = List.from(pub.imageUrls);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (picked.isNotEmpty && mounted) {
      final files = <FilePayload>[];
      for (final p in picked) {
        final bytes = await p.readAsBytes();
        files.add(FilePayload(bytes: bytes, name: p.name));
      }
      setState(() => _newFiles.addAll(files));
    }
  }

  Future<void> _removeNewFile(int index) async {
    setState(() => _newFiles.removeAt(index));
  }

  Future<void> _removeExistingImage(String url) async {
    setState(() {
      _existingImages.remove(url);
      _imagesToDelete.add(url);
    });
  }

  bool _validate() {
    if (_titleController.text.trim().isEmpty) {
      _showError('El título es obligatorio');
      return false;
    }
    if (_descriptionController.text.trim().isEmpty) {
      _showError('La descripción es obligatoria');
      return false;
    }
    if (_priceController.text.trim().isEmpty) {
      _showError('El precio es obligatorio');
      return false;
    }
    if (double.tryParse(_priceController.text.trim()) == null) {
      _showError('El precio debe ser un número válido');
      return false;
    }
    return true;
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  Future<void> _save() async {
    if (!_validate()) return;

    setState(() => _isLoading = true);
    try {
      final service = ref.read(publicationServiceProvider);

      if (_isEditing) {
        await service.updatePublication(
          id: widget.publication!.id,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          type: _selectedType,
          price: _priceController.text.trim(),
          imageUrlsToDelete: _imagesToDelete.isNotEmpty ? _imagesToDelete : null,
          files: _newFiles.isNotEmpty ? _newFiles : null,
        );
      } else {
        await service.createPublication(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          type: _selectedType,
          price: _priceController.text.trim(),
          files: _newFiles.isNotEmpty ? _newFiles : null,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditing
                  ? 'Publicación actualizada'
                  : 'Publicación creada',
            ),
          ),
        );
        if (context.canPop()) {
          context.pop();
        } else {
          _titleController.clear();
          _descriptionController.clear();
          _priceController.clear();
          setState(() {
            _selectedType = 'DISH';
            _newFiles = [];
            _existingImages = [];
            _imagesToDelete = [];
          });
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Error: ${e.toString()}');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text(
          _isEditing ? 'Editar Publicación' : 'Nueva Publicación',
          style: AppTypography.titleLarge,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            }
          },
        ),
      ),
      body: FuturisticBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.m, AppSpacing.s, AppSpacing.m, 96,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CustomTextField(
                label: 'Título',
                controller: _titleController,
                hintText: 'Nombre del producto',
              ),
              const SizedBox(height: AppSpacing.m),
              CustomTextField(
                label: 'Descripción',
                controller: _descriptionController,
                hintText: 'Describe el producto',
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: AppSpacing.m),
              CustomTextField(
                label: 'Precio',
                controller: _priceController,
                hintText: '\$ 0.00',
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: AppSpacing.m),
              CustomDropdownField(
                label: 'Tipo',
                value: _selectedType,
                items: _types,
                onChanged: (val) {
                  if (val != null) setState(() => _selectedType = val);
                },
                itemLabelBuilder: (val) {
                  switch (val) {
                    case 'DISH': return 'Plato';
                    case 'PROMOTION': return 'Promoción';
                    case 'COMBO': return 'Combo';
                    case 'BEVERAGE': return 'Bebida';
                    case 'DESSERT': return 'Postre';
                    default: return val;
                  }
                },
              ),
              const SizedBox(height: AppSpacing.l),
              Text(
                'IMÁGENES',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.accent,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: AppSpacing.s),
              if (_existingImages.isNotEmpty) ...[
                Wrap(
                  spacing: AppSpacing.s,
                  runSpacing: AppSpacing.s,
                  children: _existingImages.map((url) => _ImageThumbnail(
                    url: url,
                    onRemove: () => _removeExistingImage(url),
                  )).toList(),
                ),
                const SizedBox(height: AppSpacing.s),
              ],
              if (_newFiles.isNotEmpty) ...[
                Wrap(
                  spacing: AppSpacing.s,
                  runSpacing: AppSpacing.s,
                  children: List.generate(_newFiles.length, (i) => _NewFileThumbnail(
                    file: _newFiles[i],
                    index: i,
                    onRemove: () => _removeNewFile(i),
                  )),
                ),
                const SizedBox(height: AppSpacing.s),
              ],
              OutlinedButton.icon(
                onPressed: _pickImages,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.accent,
                  side: const BorderSide(color: AppColors.accent),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.m),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                ),
                icon: const Icon(Icons.add_photo_alternate_outlined, size: 20),
                label: const Text('AGREGAR IMÁGENES'),
              ),
              const SizedBox(height: AppSpacing.xl),
              PrimaryButton(
                label: _isEditing ? 'Guardar cambios' : 'Crear publicación',
                onPressed: _save,
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ImageThumbnail extends StatelessWidget {
  final String url;
  final VoidCallback onRemove;

  const _ImageThumbnail({required this.url, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.s),
          child: CachedNetworkImage(
            imageUrl: url,
            width: 80,
            height: 80,
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          top: 2,
          right: 2,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

class _NewFileThumbnail extends StatelessWidget {
  final FilePayload file;
  final int index;
  final VoidCallback onRemove;

  const _NewFileThumbnail({
    required this.file,
    required this.index,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.s),
          child: Image.memory(
            Uint8List.fromList(file.bytes),
            width: 80,
            height: 80,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              width: 80,
              height: 80,
              color: AppColors.surfaceHighlight,
              child: const Icon(Icons.image, color: AppColors.textTertiary),
            ),
          ),
        ),
        Positioned(
          top: 2,
          right: 2,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(Icons.close, size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
