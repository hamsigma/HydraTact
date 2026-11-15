import 'dart:ffi';
import 'dart:io';
import 'package:isar/isar.dart';

/// Inisialisasi library IsarCore pada platform desktop;
/// memakai isar.dll lokal di direktori kerja bila tersedia (Windows).
Future<void> initializeIsarCoreForPlatform() async {
  if (Platform.isWindows) {
    final localDll = File('isar.dll');
    if (localDll.existsSync()) {
      await Isar.initializeIsarCore(libraries: {
        Abi.windowsX64: localDll.absolute.path,
      });
    }
  }
}
