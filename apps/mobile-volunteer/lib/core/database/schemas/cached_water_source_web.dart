/// Varian web untuk [CachedWaterSource] — bentuk field identik dengan versi Isar
/// agar seluruh widget UI (panel, screen, marker) dapat dikompilasi di Chrome.
/// Penyimpanan lokal Isar tidak tersedia di web, model ini murni data class.
class CachedWaterSource {
  int localId = 0;

  late String serverId;

  late String name;
  late String sourceType; // PDAM_HYDRANT, COMMUNITY_TOWER, RIVER_TIDAL_DOCK
  late double latitude;
  late double longitude;
  late String operationalStatus; // READY, LOW_DISCHARGE, EMPTY, DAMAGED
  late double pressureBar;
  late DateTime updatedAt;
}
