/// Parses error payloads documented in API v2.1.
class ApiException implements Exception {
  final int? statusCode;
  final String error;
  final String message;
  final List<String> validationMessages;

  ApiException({
    this.statusCode,
    required this.error,
    required this.message,
    this.validationMessages = const [],
  });

  /// User-facing message: prefers validation list, then meaningful text over generic errors.
  String get displayMessage {
    if (validationMessages.isNotEmpty) {
      return validationMessages.join('\n');
    }

    final genericErrors = {'forbidden', 'unauthorized', 'http exception'};
    final normalizedError = error.toLowerCase().trim();
    final hasUsefulMessage =
        message.isNotEmpty && !genericErrors.contains(message.toLowerCase().trim());

    if (hasUsefulMessage) {
      return message;
    }

    if (error.isNotEmpty && !genericErrors.contains(normalizedError)) {
      return error;
    }

    if (message.isNotEmpty) {
      return message;
    }

    if (statusCode == 403) {
      return 'Acceso no permitido para este tipo de cuenta';
    }
    if (statusCode == 401) {
      return 'Credenciales inválidas';
    }

    return 'Ocurrió un error, intenta nuevamente';
  }

  factory ApiException.fromDio({
    required int? statusCode,
    dynamic data,
    String fallback = 'Ocurrió un error, intenta nuevamente',
  }) {
    if (data is! Map<String, dynamic>) {
      return ApiException(
        statusCode: statusCode,
        error: '',
        message: fallback,
      );
    }

    final errorField = data['error'];
    final messageField = data['message'];

    var error = '';
    if (errorField is String) {
      error = errorField;
    }

    var message = '';
    final validationMessages = <String>[];

    if (messageField is List) {
      validationMessages.addAll(
        messageField.map((item) => item.toString()),
      );
      message = validationMessages.join('\n');
    } else if (messageField is String) {
      message = messageField;
    }

    return ApiException(
      statusCode: statusCode,
      error: error,
      message: message.isNotEmpty ? message : fallback,
      validationMessages: validationMessages,
    );
  }

  @override
  String toString() => displayMessage;
}
