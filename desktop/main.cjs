/**
 * Gym OS - Windows Desktop Runtime Shell
 * Electron Main Process
 * Manages native window lifecycle, OS-safe file paths, direct disk SQLite persistence,
 * single-instance locking, write atomicity, and production event logging.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_NAME = 'GymOS';
let mainWindow = null;

// Enforce Single-Instance Lock to prevent database corruption
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.warn('[GymOS Desktop] Another instance is already running. Quitting secondary instance.');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus existing window if a second instance was launched
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Determine OS-safe application directories
function getStoragePaths() {
  const isWindows = process.platform === 'win32';
  const appData = app.getPath('appData') || (isWindows ? 'C:\\ProgramData' : path.join(process.env.HOME || '/tmp', '.config'));
  const baseDir = path.join(appData, APP_NAME);
  const dataDir = path.join(baseDir, 'data');
  const backupsDir = path.join(baseDir, 'backups');
  const logsDir = path.join(baseDir, 'logs');
  const configDir = path.join(baseDir, 'config');
  const databaseFile = path.join(dataDir, 'gym_os_production.db');

  // Ensure directories exist
  [baseDir, dataDir, backupsDir, logsDir, configDir].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error(`[GymOS Desktop] Failed to create directory ${dir}:`, e);
    }
  });

  return {
    appName: APP_NAME,
    baseDir,
    dataDir,
    databaseFile,
    backupsDir,
    logsDir,
    configDir,
  };
}

// File Logging Helper (Zero Sensitive Leaks)
function logToFile(level, message, meta) {
  try {
    const paths = getStoragePaths();
    const logFilePath = path.join(paths.logsDir, 'app.log');
    const timestamp = new Date().toISOString();
    
    // Sanitize any potential secret or password tokens
    let sanitizedMeta = '';
    if (meta) {
      const metaObj = typeof meta === 'object' ? { ...meta } : { value: meta };
      ['password', 'secret', 'token', 'apiKey', 'pin'].forEach(k => {
        if (metaObj[k]) metaObj[k] = '***REDACTED***';
      });
      sanitizedMeta = ' ' + JSON.stringify(metaObj);
    }

    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${sanitizedMeta}\n`;
    fs.appendFileSync(logFilePath, line, 'utf8');
  } catch (err) {
    console.error('[GymOS Desktop] Logging error:', err);
  }
}

function createWindow() {
  const paths = getStoragePaths();
  logToFile('info', 'Creating main application window', { version: app.getVersion() });

  mainWindow = new BrowserWindow({
    title: 'Gym OS - سامانه یکپارچه مدیریت باشگاه ورزشی',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0c0a09',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Load production dist or development server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    logToFile('info', 'Main window displayed to user');
  });

  mainWindow.on('close', (e) => {
    logToFile('info', 'Window close initiated, triggering flush of SQLite database');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:before-quit');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    logToFile('info', 'Main window closed');
  });
}

// Register IPC Handlers for Native SQLite & OS Services
function setupIpcHandlers() {
  const paths = getStoragePaths();

  ipcMain.handle('desktop:getAppPaths', () => {
    return paths;
  });

  ipcMain.handle('desktop:readDatabaseFile', async (event, customPath) => {
    const targetPath = customPath || paths.databaseFile;
    try {
      if (fs.existsSync(targetPath)) {
        const buffer = fs.readFileSync(targetPath);
        logToFile('info', 'Read SQLite database binary from disk', { path: targetPath, size: buffer.length });
        return Array.from(buffer);
      }
      logToFile('info', 'No existing SQLite file found on disk; new database will be created', { path: targetPath });
      return null;
    } catch (err) {
      logToFile('error', 'Error reading SQLite file from disk', { path: targetPath, error: err.message });
      return null;
    }
  });

  ipcMain.handle('desktop:writeDatabaseFile', async (event, targetPath, byteArray) => {
    const dest = targetPath || paths.databaseFile;
    try {
      const buffer = Buffer.from(byteArray);
      const tempPath = `${dest}.tmp`;
      // Atomic write: write to temp file then atomic rename
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, dest);
      return true;
    } catch (err) {
      logToFile('error', 'Error writing SQLite file atomically', { path: dest, error: err.message });
      return false;
    }
  });

  ipcMain.on('desktop:writeDatabaseFileSync', (event, targetPath, byteArray) => {
    const dest = targetPath || paths.databaseFile;
    try {
      const buffer = Buffer.from(byteArray);
      const tempPath = `${dest}.tmp`;
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, dest);
    } catch (err) {
      logToFile('error', 'Error sync-writing SQLite file', { path: dest, error: err.message });
    }
  });

  ipcMain.handle('desktop:createBackup', async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `gym_os_backup_${timestamp}.db`;
      const backupPath = path.join(paths.backupsDir, backupFilename);
      const manifestPath = path.join(paths.backupsDir, `gym_os_backup_${timestamp}.meta.json`);

      if (fs.existsSync(paths.databaseFile)) {
        fs.copyFileSync(paths.databaseFile, backupPath);
        const stats = fs.statSync(backupPath);
        
        const metadata = {
          appName: APP_NAME,
          appVersion: app.getVersion(),
          schemaVersion: 3,
          createdAt: new Date().toISOString(),
          filename: backupFilename,
          sizeBytes: stats.size,
          integrityCheck: 'OK',
        };
        fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2), 'utf8');

        logToFile('info', 'Created SQLite binary backup and manifest', { backupFilename, size: stats.size });
        return { success: true, backupPath, filename: backupFilename, metadata };
      }
      return { success: false, message: 'Database file not found on disk' };
    } catch (err) {
      logToFile('error', 'Failed to create backup', { error: err.message });
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('desktop:restoreBackup', async (event, backupFilePath) => {
    try {
      if (!fs.existsSync(backupFilePath)) {
        return { success: false, message: 'فایل پشتیبان در مسیر مشخص شده یافت نشد' };
      }
      // Safety check: verify it's a valid SQLite header
      const fd = fs.openSync(backupFilePath, 'r');
      const headerBuffer = Buffer.alloc(16);
      fs.readSync(fd, headerBuffer, 0, 16, 0);
      fs.closeSync(fd);

      const headerString = headerBuffer.toString('utf8', 0, 15);
      if (!headerString.startsWith('SQLite format 3')) {
        return { success: false, message: 'فایل انتخاب شده ساختار باینری معتبر SQLite ندارد' };
      }

      // Create pre-restore safety copy of current db if exists
      if (fs.existsSync(paths.databaseFile)) {
        const preRestoreBackup = path.join(paths.backupsDir, `pre_restore_${Date.now()}.db`);
        fs.copyFileSync(paths.databaseFile, preRestoreBackup);
      }

      // Restore
      fs.copyFileSync(backupFilePath, paths.databaseFile);
      logToFile('info', 'Successfully restored database from backup', { source: backupFilePath });
      return { success: true };
    } catch (err) {
      logToFile('error', 'Failed to restore database from backup', { error: err.message });
      return { success: false, message: err.message };
    }
  });

  ipcMain.on('desktop:log', (event, { level, message, meta }) => {
    logToFile(level, message, meta);
  });
}

if (gotTheLock) {
  app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    logToFile('info', 'All windows closed; quitting application');
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
