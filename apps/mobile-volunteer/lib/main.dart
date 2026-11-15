import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'core/bootstrap/isar_core_loader.dart';
import 'core/database/isar_service.dart';
import 'core/network/api_client.dart';
import 'core/network/models/enums.dart';
import 'core/sync/optimistic_mutation_service.dart';
import 'core/sync/outbox_worker.dart';
import 'core/theme/tactical_theme.dart';
import 'features/map/services/mbtiles_service.dart';
import 'features/tactical_view/screens/tactical_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi IsarCore pada platform desktop (no-op pada web)
  await initializeIsarCoreForPlatform();

  runApp(const HydraTactVolunteerApp());
}

class HydraTactVolunteerApp extends StatefulWidget {
  const HydraTactVolunteerApp({super.key});

  @override
  State<HydraTactVolunteerApp> createState() => _HydraTactVolunteerAppState();
}

class _HydraTactVolunteerAppState extends State<HydraTactVolunteerApp> {
  final MbTilesService _mbtilesService = MbTilesService();
  late final IsarService _isarService;
  late final HydraTactApiClient _apiClient;
  late final OutboxWorker _outboxWorker;
  late final OptimisticMutationService _optimisticService;

  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _bootstrapServices();
  }

  Future<void> _bootstrapServices() async {
    // 1. Inisialisasi peta MBTiles luring (tetap lanjut meski aset .mbtiles belum tersedia)
    try {
      await _mbtilesService.initialize();
    } catch (e) {
      debugPrint('[Bootstrap] MBTiles belum tersedia, peta berjalan tanpa tile luring: $e');
    }

    // 2. Inisialisasi database Isar luring
    _isarService = IsarService();
    await _isarService.open();

    // 3. Inisialisasi Klien API, OutboxWorker, dan OptimisticMutationService
    _apiClient = HydraTactApiClient();
    _outboxWorker = OutboxWorker(
      isarService: _isarService,
      apiClient: _apiClient,
      initialOnline: true,
    );
    await _outboxWorker.start();

    _optimisticService = OptimisticMutationService(
      isarService: _isarService,
      outboxWorker: _outboxWorker,
    );

    if (mounted) {
      setState(() {
        _isInitialized = true;
      });
    }
  }

  @override
  void dispose() {
    _outboxWorker.dispose();
    _apiClient.close();
    _isarService.close();
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
              outboxWorker: _outboxWorker,
              optimisticMutationService: _optimisticService,
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
