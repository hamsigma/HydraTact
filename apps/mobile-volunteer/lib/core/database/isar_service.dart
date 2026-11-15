/// Conditional export database lokal:
/// - Native (Android/Windows/VM test): Isar DB asli (default)
/// - Web (Chrome): implementasi in-memory
export 'isar_service_io.dart' if (dart.library.html) 'isar_service_web.dart';
