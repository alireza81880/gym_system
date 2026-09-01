/**
 * Storage Path Resolution Service
 * Provides OS-safe, non-hardcoded application directories for Desktop and Web environments.
 * Follows Windows/POSIX standards:
 * - Windows: %APPDATA%\GymOS\
 * - Linux: ~/.config/GymOS/
 * - Web/Browser: Local Isolated Virtual Storage
 */

export interface AppPaths {
  readonly appName: string;
  readonly baseDir: string;
  readonly dataDir: string;
  readonly databaseFile: string;
  readonly backupsDir: string;
  readonly logsDir: string;
  readonly configDir: string;
}

export class StoragePathService {
  private static readonly APP_NAME = 'GymOS';
  private static readonly DB_FILENAME = 'gym_os_production.db';

  /**
   * Resolves the standard storage paths for the current environment
   */
  static getPaths(): AppPaths {
    // 1. Check if running inside Electron / Desktop environment with exposed paths
    if (typeof window !== 'undefined' && (window as any).gymDesktopApi?.getAppPaths) {
      return (window as any).gymDesktopApi.getAppPaths();
    }

    // 2. Node.js Desktop Process
    if (typeof process !== 'undefined' && process.env) {
      const isWindows = process.platform === 'win32';
      const appData = process.env.APPDATA || 
        (isWindows ? 'C:\\ProgramData\\GymOS' : `${process.env.HOME || '/tmp'}/.config/GymOS`);
      
      const baseDir = `${appData}/${this.APP_NAME}`.replace(/\\/g, '/');
      const dataDir = `${baseDir}/data`;
      
      return {
        appName: this.APP_NAME,
        baseDir,
        dataDir,
        databaseFile: `${dataDir}/${this.DB_FILENAME}`,
        backupsDir: `${baseDir}/backups`,
        logsDir: `${baseDir}/logs`,
        configDir: `${baseDir}/config`,
      };
    }

    // 3. Browser / PWA Sandbox Environment
    const virtualBase = `virtual://app-storage/${this.APP_NAME}`;
    return {
      appName: this.APP_NAME,
      baseDir: virtualBase,
      dataDir: `${virtualBase}/data`,
      databaseFile: `${virtualBase}/data/${this.DB_FILENAME}`,
      backupsDir: `${virtualBase}/backups`,
      logsDir: `${virtualBase}/logs`,
      configDir: `${virtualBase}/config`,
    };
  }

  /**
   * Returns human-readable storage location summary for diagnostics UI
   */
  static getStorageSummary(): { runtime: 'Desktop-Native' | 'Browser-Isolated'; dbPath: string; isPersistent: boolean } {
    const isDesktop = typeof window !== 'undefined' && Boolean((window as any).gymDesktopApi?.isDesktop);
    const paths = this.getPaths();
    
    return {
      runtime: isDesktop ? 'Desktop-Native' : 'Browser-Isolated',
      dbPath: paths.databaseFile,
      isPersistent: true,
    };
  }
}
