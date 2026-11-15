/// Stub web untuk layanan MBTiles.
/// Pembacaan berkas .mbtiles (SQLite/FFI) tidak tersedia di Chrome, sehingga
/// layanan ini melaporkan diri tidak siap — TacticalMapView otomatis melewati
/// VectorTileLayer dan menampilkan latar peta polos beserta seluruh marker,
/// cincin konsensus, dan barikade.
class MbTilesService {
  MbTilesService({this.assetPath = 'assets/maps/samarinda_dense.mbtiles'});

  final String assetPath;

  int _initLatencyMs = 0;
  bool _initialized = false;

  dynamic get mbtiles => null;

  dynamic get vectorTileProvider => null;

  int get initLatencyMs => _initLatencyMs;

  String? get resolvedFilePath => _initialized ? assetPath : null;

  bool get isReady => false;

  Future<String> resolveFilePath([String? customPath]) async {
    return customPath?.isNotEmpty == true ? customPath! : assetPath;
  }

  Future<void> initialize({String? customPath}) async {
    _initLatencyMs = 0;
    _initialized = true;
  }

  dynamic getMetadata() => null;

  void dispose() {}
}
