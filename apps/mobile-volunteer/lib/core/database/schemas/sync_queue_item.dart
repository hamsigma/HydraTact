/// Conditional export antrean mutasi outbox:
/// - Native (Android/Windows/VM test): skema Isar asli (default)
/// - Web (Chrome): kelas murni tanpa dependensi Isar
export 'sync_queue_item_io.dart' if (dart.library.html) 'sync_queue_item_web.dart';
