import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/database/schemas/cached_water_source.dart';
import '../../../../core/network/models/enums.dart';
import '../../../../core/sync/optimistic_mutation_service.dart';
import '../../../../core/sync/outbox_worker.dart';
import '../../../../core/theme/tactical_colors.dart';
import '../../../../core/utils/geo_utils.dart';
import '../../map/services/mbtiles_service.dart';
import '../../map/widgets/tactical_map_view.dart';
import '../../map/widgets/tactical_markers.dart';
import '../widgets/attacker_action_panel.dart';
import '../widgets/feeder_action_panel.dart';
import '../widgets/nearest_water_sources_panel.dart';

enum BottomPanelTab { actions, waterSources }

/// Tactical Screen combining the 60% Offline Map View and 40% Adaptive Action Panel
/// Sesuai docs/Design.md Bagian 5 & 7.2 serta TASK-403, TASK-404, TASK-407:
/// - Area Peta Utama: 60% tinggi layar ponsel
/// - Panel Kontrol Aksi Bawah: 40% tinggi layar ponsel
/// - Adaptif terhadap peran ATTACKER vs FEEDER
/// - Modul 3 Titik Sumber Air Terdekat (Haversine & Filter Status)
/// - Terhubung dengan OutboxWorker & OptimisticMutationService (TASK-407)
class TacticalScreen extends StatefulWidget {
  const TacticalScreen({
    super.key,
    required this.mbtilesService,
    this.outboxWorker,
    this.optimisticMutationService,
    this.initialRole = TacticalRole.ATTACKER,
    this.initialCenter = const LatLng(-0.4942, 117.1441), // Jl. Pelita Gg. 4
    this.renderVectorTiles = true,
    this.customWaterSources,
  });

  final MbTilesService mbtilesService;
  final OutboxWorker? outboxWorker;
  final OptimisticMutationService? optimisticMutationService;
  final TacticalRole initialRole;
  final LatLng initialCenter;
  final bool renderVectorTiles;
  final List<CachedWaterSource>? customWaterSources;

  @override
  State<TacticalScreen> createState() => _TacticalScreenState();
}

class _TacticalScreenState extends State<TacticalScreen> {
  late TacticalRole _currentRole;
  BottomPanelTab _selectedTab = BottomPanelTab.actions;
  bool _isPressureRequested = false;
  bool _isBarricadeActive = false;
  String _syncStatusText = 'ONLINE (TERHUBUNG)';
  List<WaterSourceWithDistance> _nearestWaterSources = [];

  // Skenario Jl. Pelita Gg. 4
  static const LatLng _fireIncidentPoint = LatLng(-0.4942, 117.1441);
  static const LatLng _attackerPoint = LatLng(-0.4938, 117.1443);
  static const LatLng _feederPoint = LatLng(-0.4952, 117.1428);
  static const LatLng _hydrantPoint = LatLng(-0.4948, 117.1450);

  // Barikade selang fuchsia (Jl. Pelita Gg. 4 ke jalan arteri)
  final List<LatLng> _barricadePoints = const [
    LatLng(-0.4952, 117.1428), // Posisi Feeder
    LatLng(-0.4947, 117.1435), // Belokan gang
    LatLng(-0.4938, 117.1443), // Posisi Attacker
  ];

  @override
  void initState() {
    super.initState();
    _currentRole = widget.initialRole;
    _initWaterSources();

    // Pantau status konektivitas & antrean sinkronisasi dari OutboxWorker
    final worker = widget.outboxWorker;
    if (worker != null) {
      _syncStatusText = worker.statusNotifier.value.tacticalStatusText;
      worker.statusNotifier.addListener(_onOutboxStatusChanged);
    }
  }

  void _initWaterSources() {
    final sources = widget.customWaterSources ?? _createDefaultWaterSources();
    _nearestWaterSources = GeoUtils.findNearestWaterSources(
      origin: widget.initialCenter,
      sources: sources,
      limit: 3,
      filterUsableOnly: true,
    );
  }

  List<CachedWaterSource> _createDefaultWaterSources() {
    return [
      CachedWaterSource()
        ..serverId = 'ws-pelita-pdam'
        ..name = 'PDAM Jl. Pelita Gg. 4'
        ..sourceType = 'PDAM_HYDRANT'
        ..latitude = -0.4938
        ..longitude = 117.1448
        ..operationalStatus = 'READY'
        ..pressureBar = 4.2
        ..updatedAt = DateTime.now().toUtc(),
      CachedWaterSource()
        ..serverId = 'ws-pelita-tandon'
        ..name = 'Tandon Komunitas RT 12'
        ..sourceType = 'COMMUNITY_TOWER'
        ..latitude = -0.4946
        ..longitude = 117.1432
        ..operationalStatus = 'LOW_DISCHARGE'
        ..pressureBar = 2.1
        ..updatedAt = DateTime.now().toUtc(),
      CachedWaterSource()
        ..serverId = 'ws-pelita-dermaga'
        ..name = 'Dermaga Pasang Surut SKM'
        ..sourceType = 'RIVER_TIDAL_DOCK'
        ..latitude = -0.4955
        ..longitude = 117.1450
        ..operationalStatus = 'READY'
        ..pressureBar = 3.8
        ..updatedAt = DateTime.now().toUtc(),
      CachedWaterSource()
        ..serverId = 'ws-pelita-rusak'
        ..name = 'Pipa Rusak Ujung Gg. 5'
        ..sourceType = 'PDAM_HYDRANT'
        ..latitude = -0.4930
        ..longitude = 117.1430
        ..operationalStatus = 'DAMAGED'
        ..pressureBar = 0.0
        ..updatedAt = DateTime.now().toUtc(),
    ];
  }

  @override
  void dispose() {
    widget.outboxWorker?.statusNotifier.removeListener(_onOutboxStatusChanged);
    super.dispose();
  }

  void _onOutboxStatusChanged() {
    final status = widget.outboxWorker?.statusNotifier.value;
    if (status != null && mounted) {
      setState(() {
        _syncStatusText = status.tacticalStatusText;
      });
    }
  }

  void _toggleRole() {
    setState(() {
      _currentRole = _currentRole == TacticalRole.ATTACKER
          ? TacticalRole.FEEDER
          : TacticalRole.ATTACKER;
    });
  }

  Future<void> _togglePressure() async {
    final newRequested = !_isPressureRequested;
    setState(() {
      _isPressureRequested = newRequested;
    });

    if (newRequested) {
      await widget.optimisticMutationService?.requestWaterPressureOptimistic(
        unitId: 'ATK-01',
        targetPressureBar: 5.0,
      );
    }
  }

  Future<void> _toggleBarricade() async {
    final newActive = !_isBarricadeActive;
    setState(() {
      _isBarricadeActive = newActive;
    });

    await widget.optimisticMutationService?.toggleBarricadeOptimistic(
      barricadeId: 'barr-pelita-01',
      activate: newActive,
      unitId: 'FDR-01',
    );
  }

  Future<void> _handleUpdateWaterStatus(CachedWaterSource source, String newStatus) async {
    setState(() {
      source.operationalStatus = newStatus;
    });

    await widget.optimisticMutationService?.updateWaterSourceStatusOptimistic(
      serverId: source.serverId,
      newStatus: newStatus,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAttacker = _currentRole == TacticalRole.ATTACKER;
    final roleTitle = isAttacker ? 'MODE ATTACKER' : 'MODE FEEDER';

    return Scaffold(
      backgroundColor: TacticalColors.surface0,
      body: SafeArea(
        child: Column(
          children: [
            // 60% Area Peta Utama (flex: 6)
            Expanded(
              flex: 6,
              child: TacticalMapView(
                mbtilesService: widget.mbtilesService,
                initialCenter: widget.initialCenter,
                initialZoom: 16.0,
                roleTitle: roleTitle,
                isAttacker: isAttacker,
                syncStatusText: _syncStatusText,
                renderVectorTiles: widget.renderVectorTiles,
                circleMarkers: const [
                  CircleMarker(
                    point: _fireIncidentPoint,
                    radius: 45.0, // Visual representation of 100m radius
                    color: TacticalColors.attackerSoftBg,
                    borderColor: TacticalColors.attacker,
                    borderStrokeWidth: 1.5,
                  ),
                ],
                polylines: [
                  if (_isBarricadeActive)
                    Polyline(
                      points: _barricadePoints,
                      color: TacticalColors.barricade,
                      strokeWidth: 4.0,
                    ),
                ],
                markers: const [
                  Marker(
                    point: _fireIncidentPoint,
                    width: 72,
                    height: 56,
                    child: IncidentFireMarkerWidget(label: 'Gg. 4 Pelita'),
                  ),
                  Marker(
                    point: _attackerPoint,
                    width: 72,
                    height: 56,
                    child: AttackerMarkerWidget(
                      unitCode: 'ATK-01',
                      bearingDegrees: 45.0,
                    ),
                  ),
                  Marker(
                    point: _feederPoint,
                    width: 72,
                    height: 56,
                    child: FeederMarkerWidget(unitCode: 'FDR-01'),
                  ),
                  Marker(
                    point: _hydrantPoint,
                    width: 72,
                    height: 56,
                    child: WaterSourceMarkerWidget(
                      status: WaterSourceStatus.READY,
                      distanceMeters: 85,
                    ),
                  ),
                ],
              ),
            ),

            // Tombol Switch Peran Cepat (untuk pengujian & operasional lapangan)
            Container(
              height: 28.0,
              color: TacticalColors.surface1,
              child: InkWell(
                onTap: _toggleRole,
                child: Center(
                  child: Text(
                    'KETUK UNTUK GANTI PERAN (SAAT INI: $roleTitle)',
                    style: const TextStyle(
                      fontFamily: 'RobotoMono',
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: TacticalColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),

            // Tab Selector Bawah: KONTROL PERAN vs 3 TITIK AIR (NO PILL CHIPS)
            Container(
              height: 32.0,
              decoration: const BoxDecoration(
                color: TacticalColors.surface0,
                border: Border(
                  top: BorderSide(color: TacticalColors.borderSubtle, width: 1),
                  bottom: BorderSide(color: TacticalColors.borderSubtle, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedTab = BottomPanelTab.actions),
                      child: Container(
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _selectedTab == BottomPanelTab.actions
                              ? TacticalColors.surface2
                              : Colors.transparent,
                          border: Border(
                            bottom: BorderSide(
                              color: _selectedTab == BottomPanelTab.actions
                                  ? (isAttacker ? TacticalColors.attacker : TacticalColors.feeder)
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          'KONTROL $roleTitle',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color: _selectedTab == BottomPanelTab.actions
                                ? TacticalColors.textPrimary
                                : TacticalColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedTab = BottomPanelTab.waterSources),
                      child: Container(
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _selectedTab == BottomPanelTab.waterSources
                              ? TacticalColors.surface2
                              : Colors.transparent,
                          border: Border(
                            bottom: BorderSide(
                              color: _selectedTab == BottomPanelTab.waterSources
                                  ? TacticalColors.waterReady
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                        ),
                        child: Text(
                          'SUMBER AIR (3 TERDEKAT)',
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color: _selectedTab == BottomPanelTab.waterSources
                                ? TacticalColors.textPrimary
                                : TacticalColors.textMuted,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 40% Panel Kontrol Aksi Bawah (flex: 4)
            Expanded(
              flex: 4,
              child: _selectedTab == BottomPanelTab.waterSources
                  ? SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: NearestWaterSourcesPanel(
                          items: _nearestWaterSources,
                          initialExpandedServerId: 'ws-pelita-pdam',
                          onUpdateStatus: _handleUpdateWaterStatus,
                        ),
                      ),
                    )
                  : (isAttacker
                      ? AttackerActionPanel(
                          isPressureRequested: _isPressureRequested,
                          onTogglePressure: _togglePressure,
                          unitCode: 'ATK-01',
                          targetPressureBar: 5.0,
                        )
                      : FeederActionPanel(
                          isBarricadeActive: _isBarricadeActive,
                          onToggleBarricade: _toggleBarricade,
                          unitCode: 'FDR-01',
                          arteryRoadName: 'JL. PELITA UTAMA',
                          remainingWaterLiters: 4200,
                        )),
            ),
          ],
        ),
      ),
    );
  }
}
