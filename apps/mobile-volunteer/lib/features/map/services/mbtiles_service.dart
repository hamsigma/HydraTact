/// Conditional export peta MBTiles:
/// - Native (Android/Windows/VM test): renderer MBTiles asli (default)
/// - Web (Chrome): stub tanpa tile vektor
export 'mbtiles_service_io.dart' if (dart.library.html) 'mbtiles_service_web.dart';
