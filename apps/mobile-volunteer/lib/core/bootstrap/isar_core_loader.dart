/// Conditional export loader IsarCore:
/// - Native (Android/Windows/VM test): memuat isar.dll bawaan (default)
/// - Web (Chrome): tidak perlu inisialisasi
export 'isar_core_loader_io.dart' if (dart.library.html) 'isar_core_loader_stub.dart';
