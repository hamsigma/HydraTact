import 'package:flutter/material.dart' hide Theme;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:vector_map_tiles/vector_map_tiles.dart';
import '../../../core/theme/tactical_colors.dart';
import '../../../core/theme/tactical_typography.dart';
import '../services/mbtiles_service.dart';
import '../theme/tactical_map_theme.dart';

/// Tactical Map View using FlutterMap and offline MBTiles vector renderer.
/// Sesuai docs/Design.md Bagian 6 & 7.2.
class TacticalMapView extends StatefulWidget {
  const TacticalMapView({
    super.key,
    required this.mbtilesService,
    this.mapController,
    this.initialCenter = const LatLng(-0.4942, 117.1441), // Jl. Pelita Gg. 4
    this.initialZoom = 16.0,
    this.markers = const [],
    this.circleMarkers = const [],
    this.polylines = const [],
    this.roleTitle = 'MODE ATTACKER',
    this.isAttacker = true,
    this.syncStatusText = 'ONLINE (TERHUBUNG)',
    this.renderVectorTiles = true,
    this.concurrency = 0,
    this.onMapReady,
  });

  final MbTilesService mbtilesService;
  final MapController? mapController;
  final LatLng initialCenter;
  final double initialZoom;
  final List<Marker> markers;
  final List<CircleMarker> circleMarkers;
  final List<Polyline> polylines;
  final String roleTitle;
  final bool isAttacker;
  final String syncStatusText;
  final bool renderVectorTiles;
  final int concurrency;
  final VoidCallback? onMapReady;

  @override
  State<TacticalMapView> createState() => _TacticalMapViewState();
}

class _TacticalMapViewState extends State<TacticalMapView> {
  late final MapController _controller;
  dynamic _theme;

  @override
  void initState() {
    super.initState();
    _controller = widget.mapController ?? MapController();
    if (widget.renderVectorTiles) {
      _theme = TacticalMapTheme.buildTheme();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = widget.mbtilesService.vectorTileProvider;

    return Container(
      color: TacticalColors.surface0,
      child: Column(
        children: [
          // Tactical Header (Tinggi 56 dp) sesuai docs/Design.md Bagian 7.2
          _buildTacticalHeader(),
          // Area Peta Utama (60% layar / flex ekspansi)
          Expanded(
            child: FlutterMap(
              mapController: _controller,
              options: MapOptions(
                initialCenter: widget.initialCenter,
                initialZoom: widget.initialZoom,
                minZoom: 14.0,
                maxZoom: 18.0,
                backgroundColor: TacticalColors.mapBackground,
                onMapReady: widget.onMapReady,
              ),
              children: [
                // Vector Tile Layer MBTiles
                if (widget.renderVectorTiles && provider != null && _theme != null)
                  VectorTileLayer(
                    theme: _theme,
                    concurrency: widget.concurrency,
                    tileProviders: TileProviders({
                      TacticalMapTheme.sourceId: provider,
                    }),
                  ),
                // Circle Layer (Cincin konsensus 100m)
                if (widget.circleMarkers.isNotEmpty)
                  CircleLayer(circles: widget.circleMarkers),
                // Polyline Layer (Garis barikade selang fuchsia)
                if (widget.polylines.isNotEmpty)
                  PolylineLayer(polylines: widget.polylines),
                // Marker Layer (Armada, titik api, sumber air)
                if (widget.markers.isNotEmpty)
                  MarkerLayer(markers: widget.markers),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTacticalHeader() {
    final roleBgColor = widget.isAttacker
        ? const Color(0x33EF4444) // dark red background
        : const Color(0x33F59E0B); // dark amber background
    final roleTextColor = widget.isAttacker
        ? TacticalColors.attacker
        : TacticalColors.feeder;

    return Container(
      height: 56.0,
      padding: const EdgeInsets.symmetric(horizontal: 12.0),
      decoration: const BoxDecoration(
        color: TacticalColors.surface1,
        border: Border(
          bottom: BorderSide(color: TacticalColors.borderSubtle, width: 1.0),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Mode Peran Lapangan (Bebas Pill Chips: Teks berbobot dengan batas datar)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 3.0),
            decoration: BoxDecoration(
              color: roleBgColor,
              border: Border.all(color: roleTextColor, width: 1.0),
              borderRadius: BorderRadius.circular(2.0),
            ),
            child: Text(
              widget.roleTitle,
              style: TacticalTypography.sectionTitleH2.copyWith(
                color: roleTextColor,
                fontSize: 11,
                letterSpacing: 0.8,
              ),
            ),
          ),
          const SizedBox(width: 8.0),
          // Indikator Sinkronisasi (Plain text monospace tebal, bukan oval badge)
          Flexible(
            child: Text(
              widget.syncStatusText,
              overflow: TextOverflow.ellipsis,
              style: TacticalTypography.statusText(
                color: TacticalColors.textSecondary,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
