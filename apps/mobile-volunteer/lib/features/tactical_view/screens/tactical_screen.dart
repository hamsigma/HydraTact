import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/network/models/enums.dart';
import '../../../../core/theme/tactical_colors.dart';
import '../../map/services/mbtiles_service.dart';
import '../../map/widgets/tactical_map_view.dart';
import '../../map/widgets/tactical_markers.dart';
import '../widgets/attacker_action_panel.dart';
import '../widgets/feeder_action_panel.dart';

/// Tactical Screen combining the 60% Offline Map View and 40% Adaptive Action Panel
/// Sesuai docs/Design.md Bagian 7.2:
/// - Area Peta Utama: 60% tinggi layar ponsel
/// - Panel Kontrol Aksi Bawah: 40% tinggi layar ponsel
/// - Adaptif terhadap peran ATTACKER vs FEEDER
class TacticalScreen extends StatefulWidget {
  const TacticalScreen({
    super.key,
    required this.mbtilesService,
    this.initialRole = TacticalRole.ATTACKER,
    this.initialCenter = const LatLng(-0.4942, 117.1441), // Jl. Pelita Gg. 4
    this.renderVectorTiles = true,
  });

  final MbTilesService mbtilesService;
  final TacticalRole initialRole;
  final LatLng initialCenter;
  final bool renderVectorTiles;

  @override
  State<TacticalScreen> createState() => _TacticalScreenState();
}

class _TacticalScreenState extends State<TacticalScreen> {
  late TacticalRole _currentRole;
  bool _isPressureRequested = false;
  bool _isBarricadeActive = false;
  String _syncStatusText = 'ONLINE (TERHUBUNG)';

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
  }

  void _toggleRole() {
    setState(() {
      _currentRole = (_currentRole == TacticalRole.ATTACKER)
          ? TacticalRole.FEEDER
          : TacticalRole.ATTACKER;
    });
  }

  void _togglePressure() {
    setState(() {
      _isPressureRequested = !_isPressureRequested;
    });
  }

  void _toggleBarricade() {
    setState(() {
      _isBarricadeActive = !_isBarricadeActive;
    });
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
                    color: Color(0x22EF4444),
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
            // 40% Panel Kontrol Aksi Bawah (flex: 4)
            Expanded(
              flex: 4,
              child: isAttacker
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
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
