import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'core/theme/tactical_theme.dart';
import 'features/map/services/mbtiles_service.dart';
import 'features/map/widgets/tactical_map_view.dart';
import 'features/map/widgets/tactical_markers.dart';
import 'core/network/models/enums.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HydraTactVolunteerApp());
}

class HydraTactVolunteerApp extends StatefulWidget {
  const HydraTactVolunteerApp({super.key});

  @override
  State<HydraTactVolunteerApp> createState() => _HydraTactVolunteerAppState();
}

class _HydraTactVolunteerAppState extends State<HydraTactVolunteerApp> {
  final MbTilesService _mbtilesService = MbTilesService();
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initMap();
  }

  Future<void> _initMap() async {
    await _mbtilesService.initialize();
    if (mounted) {
      setState(() {
        _isInitialized = true;
      });
    }
  }

  @override
  void dispose() {
    _mbtilesService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HydraTact Mobile Volunteer',
      debugShowCheckedModeBanner: false,
      theme: TacticalTheme.darkTheme,
      home: Scaffold(
        body: SafeArea(
          child: _isInitialized
              ? TacticalMapView(
                  mbtilesService: _mbtilesService,
                  roleTitle: 'MODE ATTACKER',
                  isAttacker: true,
                  syncStatusText: 'ONLINE (TERHUBUNG)',
                  initialCenter: const LatLng(-0.4942, 117.1441),
                  initialZoom: 16.0,
                  markers: const [
                    Marker(
                      point: LatLng(-0.4942, 117.1441),
                      width: 32,
                      height: 48,
                      child: IncidentFireMarkerWidget(
                        label: 'Gg. 4 Pelita',
                      ),
                    ),
                    Marker(
                      point: LatLng(-0.4935, 117.1445),
                      width: 32,
                      height: 48,
                      child: AttackerMarkerWidget(
                        unitCode: 'ATK-01',
                        bearingDegrees: 45.0,
                      ),
                    ),
                    Marker(
                      point: LatLng(-0.4950, 117.1430),
                      width: 32,
                      height: 48,
                      child: FeederMarkerWidget(
                        unitCode: 'FDR-01',
                      ),
                    ),
                    Marker(
                      point: LatLng(-0.4948, 117.1450),
                      width: 40,
                      height: 48,
                      child: WaterSourceMarkerWidget(
                        status: WaterSourceStatus.READY,
                        distanceMeters: 85,
                      ),
                    ),
                  ],
                )
              : const Center(
                  child: CircularProgressIndicator(),
                ),
        ),
      ),
    );
  }
}
