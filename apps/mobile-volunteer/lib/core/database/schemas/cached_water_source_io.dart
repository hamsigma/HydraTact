import 'package:isar/isar.dart';

part 'cached_water_source.g.dart';

/// Skema Cache Lokal Titik Sumber Air
/// Sesuai docs/Database.md Bagian 4 & Architecture.md
@collection
class CachedWaterSource {
  Id localId = Isar.autoIncrement;

  @Index(unique: true, replace: true)
  late String serverId;

  late String name;
  late String sourceType; // PDAM_HYDRANT, COMMUNITY_TOWER, RIVER_TIDAL_DOCK
  late double latitude;
  late double longitude;
  late String operationalStatus; // READY, LOW_DISCHARGE, EMPTY, DAMAGED
  late double pressureBar;
  late DateTime updatedAt;
}
