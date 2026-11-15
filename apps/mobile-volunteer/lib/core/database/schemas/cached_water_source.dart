/// Conditional export titik sumber air:
/// - Native (Android/Windows/VM test): skema Isar asli (default)
/// - Web (Chrome): kelas murni tanpa dependensi Isar
export 'cached_water_source_io.dart' if (dart.library.html) 'cached_water_source_web.dart';
