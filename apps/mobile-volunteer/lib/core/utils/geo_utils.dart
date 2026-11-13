import 'dart:math';
import 'package:latlong2/latlong.dart';
import '../database/schemas/cached_water_source.dart';

/// Data class yang membungkus sumber air dengan jarak terhitung
class WaterSourceWithDistance {
  const WaterSourceWithDistance({
    required this.source,
    required this.distanceMeters,
  });

  final CachedWaterSource source;
  final double distanceMeters;

  String get formattedDistance {
    if (distanceMeters < 1000) {
      return '${distanceMeters.round()} M';
    }
    return '${(distanceMeters / 1000).toStringAsFixed(1)} KM';
  }
}

/// Utilitas Geospasial Lokal (Client-Side)
/// Sesuai docs/Architecture.md & TASK-404
class GeoUtils {
  const GeoUtils._();

  static const double earthRadiusMeters = 6371000.0;

  /// Menghitung jarak lurus (Haversine formula) dalam meter antara dua koordinat
  static double haversineDistance({
    required double lat1,
    required double lon1,
    required double lat2,
    required double lon2,
  }) {
    final phi1 = lat1 * pi / 180.0;
    final phi2 = lat2 * pi / 180.0;
    final deltaPhi = (lat2 - lat1) * pi / 180.0;
    final deltaLambda = (lon2 - lon1) * pi / 180.0;

    final a = sin(deltaPhi / 2.0) * sin(deltaPhi / 2.0) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2.0) * sin(deltaLambda / 2.0);
    final c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));

    return earthRadiusMeters * c;
  }

  /// Menghitung jarak lurus dari LatLng
  static double haversineDistanceLatLng(LatLng p1, LatLng p2) {
    return haversineDistance(
      lat1: p1.latitude,
      lon1: p1.longitude,
      lat2: p2.latitude,
      lon2: p2.longitude,
    );
  }

  /// Memfilter dan mengurutkan sumber air terdekat dari posisi acuan
  /// Filter status: hanya READY dan LOW_DISCHARGE jika filterUsableOnly = true
  static List<WaterSourceWithDistance> findNearestWaterSources({
    required LatLng origin,
    required List<CachedWaterSource> sources,
    int limit = 3,
    bool filterUsableOnly = true,
  }) {
    final List<WaterSourceWithDistance> list = [];

    for (final src in sources) {
      if (filterUsableOnly) {
        final st = src.operationalStatus.toUpperCase();
        if (st != 'READY' && st != 'LOW_DISCHARGE') {
          continue;
        }
      }

      final dist = haversineDistance(
        lat1: origin.latitude,
        lon1: origin.longitude,
        lat2: src.latitude,
        lon2: src.longitude,
      );

      list.add(WaterSourceWithDistance(source: src, distanceMeters: dist));
    }

    list.sort((a, b) => a.distanceMeters.compareTo(b.distanceMeters));

    if (list.length > limit) {
      return list.sublist(0, limit);
    }
    return list;
  }
}
