import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'core/theme/tactical_theme.dart';
import 'core/network/models/enums.dart';
import 'features/map/services/mbtiles_service.dart';
import 'features/tactical_view/screens/tactical_screen.dart';

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
      home: _isInitialized
          ? TacticalScreen(
              mbtilesService: _mbtilesService,
              initialRole: TacticalRole.ATTACKER,
              initialCenter: const LatLng(-0.4942, 117.1441),
            )
          : const Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            ),
    );
  }
}
