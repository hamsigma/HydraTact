import 'package:flutter/material.dart' hide Theme;
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:vector_map_tiles/vector_map_tiles.dart';
import '../../../core/theme/tactical_colors.dart';
import '../../../core/theme/tactical_typography.dart';
import '../services/mbtiles_service.dart';
import '../theme/tactical_map_theme.dart';

/// Tipe basemap raster OSM, selaras dengan TacticalMapCanvas web dashboard
/// komando (OSM Standard / OSM Humanitarian / CartoDB Positron).
enum TacticalBaseMap { osmStandard, osmHot, cartoLight }

/// Tactical Map View using FlutterMap and offline MBTiles vector renderer.
/// Sesuai docs/Design.md Bagian 6 & 7.2.
/// Ketika tile vektor MBTiles tidak tersedia (aset belum dibundel atau di web),
/// basemap raster OpenStreetMap tampil sebagai fallback agar tampilan peta
/// sama seperti web dashboard komando (TacticalMapCanvas.tsx).
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
    this.showOsmFallback = true,
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
  final bool showOsmFallback;
  final int concurrency;
  final VoidCallback? onMapReady;

  @override
  State<TacticalMapView> createState() => _TacticalMapViewState();
}

class _TacticalMapViewState extends State<TacticalMapView> {
  late final MapController _controller;
  dynamic _theme;
  TacticalBaseMap _baseMap = TacticalBaseMap.osmStandard;

  @override
  void initState() {
    super.initState();
    _controller = widget.mapController ?? MapController();
    if (widget.renderVectorTiles) {
      _theme = TacticalMapTheme.buildTheme();
    }
  }

  String _baseMapUrlTemplate() {
    switch (_baseMap) {
      case TacticalBaseMap.osmStandard:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      case TacticalBaseMap.osmHot:
        return 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
      case TacticalBaseMap.cartoLight:
        return 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = widget.mbtilesService.vectorTileProvider;
    final useVectorTiles =
        widget.renderVectorTiles && provider != null && _theme != null;
    final showRasterBaseMap = widget.showOsmFallback && !useVectorTiles;

    return Container(
      color: TacticalColors.surface0,
      child: Column(
        children: [
          // Tactical Header (Tinggi 56 dp) sesuai docs/Design.md Bagian 7.2
          _buildTacticalHeader(),
          // Area Peta Utama (60% layar / flex ekspansi)
          Expanded(
            child: Stack(
              children: [
                FlutterMap(
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
                    // Basemap raster OpenStreetMap (fallback, sama dengan
                    // web dashboard komando)
                    if (showRasterBaseMap)
                      TileLayer(
                        urlTemplate: _baseMapUrlTemplate(),
                        subdomains: _baseMap == TacticalBaseMap.cartoLight
                            ? const ['a', 'b', 'c', 'd']
                            : const [''],
                        maxZoom: 18.0,
                        userAgentPackageName: 'id.hydratact.mobile_volunteer',
                      ),
                    // Vector Tile Layer MBTiles
                    if (useVectorTiles)
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
                // HUD Pemilih Basemap (sama seperti HUD web dashboard komando)
                if (showRasterBaseMap)
                  Positioned(
                    right: 8.0,
                    top: 8.0,
                    child: _buildBaseMapSwitcher(),
                  ),
                // Atribusi sumber tile (wajib untuk OpenStreetMap / CARTO)
                if (showRasterBaseMap)
                  Positioned(
                    left: 4.0,
                    bottom: 4.0,
                    child: _buildAttributionText(),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaseMapSwitcher() {
    Widget option(String label, TacticalBaseMap mapType) {
      final isSelected = _baseMap == mapType;
      return InkWell(
        onTap: () => setState(() => _baseMap = mapType),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 5.0),
          decoration: BoxDecoration(
            color: isSelected
                ? TacticalColors.selectedControlBg
                : TacticalColors.surface1,
            border: Border.all(
              color: isSelected
                  ? TacticalColors.selectedControlBg
                  : TacticalColors.borderSubtle,
              width: 1.0,
            ),
            borderRadius: BorderRadius.circular(2.0),
          ),
          child: Text(
            label,
            style: TacticalTypography.statusText(
              color: isSelected
                  ? TacticalColors.selectedControlText
                  : TacticalColors.textSecondary,
              fontSize: 9,
            ).copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.6),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(3.0),
      decoration: BoxDecoration(
        color: TacticalColors.surface1.withValues(alpha: 0.95),
        border: Border.all(color: TacticalColors.borderSubtle, width: 1.0),
        borderRadius: BorderRadius.circular(2.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          option('OSM STANDAR', TacticalBaseMap.osmStandard),
          const SizedBox(width: 3.0),
          option('OSM HOT', TacticalBaseMap.osmHot),
          const SizedBox(width: 3.0),
          option('MINIMALIS', TacticalBaseMap.cartoLight),
        ],
      ),
    );
  }

  Widget _buildAttributionText() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 2.0),
      color: TacticalColors.surface1.withValues(alpha: 0.90),
      child: Text(
        _baseMap == TacticalBaseMap.cartoLight
            ? '© CARTO © OpenStreetMap contributors'
            : '© OpenStreetMap contributors',
        style: TacticalTypography.statusText(
          color: TacticalColors.textMuted,
          fontSize: 8,
        ),
      ),
    );
  }

  Widget _buildTacticalHeader() {
    final roleBgColor = widget.isAttacker
        ? TacticalColors.attackerSoftBg
        : TacticalColors.feederSoftBg;
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
