import path from "node:path";
import { crashReporter, app } from "electron";

export type CrashReporterConfig = {
  /** Directory where crash dumps are written. Defaults to `<userData>/crashes`. */
  crashDumpsDir?: string;
};

/**
 * Initialise Electron's built-in crash reporter so that native crashes
 * (GPU / renderer / main) produce minidump files on disk.
 *
 * v0.1 writes to a local directory only (no remote upload).
 * A future version may add `submitURL` to upload crash dumps.
 */
export function initCrashReporter(config?: CrashReporterConfig): string {
  const dumpsDir =
    config?.crashDumpsDir ?? path.join(app.getPath("userData"), "crashes");

  crashReporter.start({
    productName: "CreoNow",
    uploadToServer: false,
    extra: {
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
    },
  });

  return dumpsDir;
}
