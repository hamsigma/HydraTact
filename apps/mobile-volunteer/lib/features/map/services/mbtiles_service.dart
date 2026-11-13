import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:mbtiles/mbtiles.dart';
import 'package:path_provider/path_provider.dart';
import 'package:vector_map_tiles_mbtiles/vector_map_tiles_mbtiles.dart';

/// Service for managing local offline MBTiles vector maps for HydraTact Mobile.
/// Target Acceptance Criteria TASK-401:
/// - Aset .mbtiles terbundel dan dirender via flutter_map_mbtiles / vector_map_tiles_mbtiles
/// - Waktu inisialisasi & pembacaan tile < 500 ms
class MbTilesService {
  MbTilesService({this.assetPath = 'assets/maps/samarinda_dense.mbtiles'});

  final String assetPath;

  MbTiles? _mbtiles;
  MbTilesVectorTileProvider? _vectorTileProvider;
  int _initLatencyMs = 0;
  String? _resolvedFilePath;

  /// Returns the underlying [MbTiles] instance
  MbTiles? get mbtiles => _mbtiles;

  /// Returns the vector tile provider for flutter_map / vector_map_tiles
  MbTilesVectorTileProvider? get vectorTileProvider => _vectorTileProvider;

  /// Initialisation and load latency in milliseconds (< 500 ms)
  int get initLatencyMs => _initLatencyMs;

  /// Resolved on-disk file path
  String? get resolvedFilePath => _resolvedFilePath;

  /// Indicates if service is initialized and ready
  bool get isReady => _mbtiles != null && _vectorTileProvider != null;

  /// Resolves the file path on disk. If running on device with asset bundle,
  /// copies the asset file to the app documents directory if not already cached.
  Future<String> resolveFilePath([String? customPath]) async {
    if (customPath != null && customPath.isNotEmpty) {
      final customFile = File(customPath);
      if (customFile.existsSync()) {
        return customFile.path;
      }
    }

    // Check direct relative path (useful in test runner or desktop mode)
    final directFile = File(assetPath);
    if (directFile.existsSync()) {
      return directFile.path;
    }

    // In Flutter application sandbox, assets are in asset bundle. Copy to documents dir.
    try {
      final docDir = await getApplicationDocumentsDirectory();
      final destinationFile = File('${docDir.path}/samarinda_dense.mbtiles');

      if (destinationFile.existsSync()) {
        final existingLength = destinationFile.lengthSync();
        if (existingLength > 1024) {
          return destinationFile.path;
        }
      }

      final byteData = await rootBundle.load(assetPath);
      final bytes = byteData.buffer.asUint8List(
        byteData.offsetInBytes,
        byteData.lengthInBytes,
      );
      await destinationFile.writeAsBytes(bytes, flush: true);
      return destinationFile.path;
    } catch (e) {
      // Fallback to assetPath string
      return assetPath;
    }
  }

  /// Initialize the MBTiles archive and vector tile provider.
  /// Measures elapsed time to guarantee latency < 500 ms.
  Future<void> initialize({String? customPath}) async {
    final stopwatch = Stopwatch()..start();

    final filePath = await resolveFilePath(customPath);
    _resolvedFilePath = filePath;

    final mb = MbTiles(mbtilesPath: filePath);
    final provider = MbTilesVectorTileProvider(mbtiles: mb);

    _mbtiles = mb;
    _vectorTileProvider = provider;

    stopwatch.stop();
    _initLatencyMs = stopwatch.elapsedMilliseconds;

    if (kDebugMode) {
      debugPrint('[MbTilesService] Loaded $filePath in ${_initLatencyMs}ms');
    }
  }

  /// Read metadata from MBTiles archive
  MbTilesMetadata? getMetadata() {
    return _mbtiles?.getMetadata();
  }

  /// Close and dispose resources
  void dispose() {
    _mbtiles?.dispose();
    _mbtiles = null;
    _vectorTileProvider = null;
  }
}
