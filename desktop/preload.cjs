/**
 * Gym OS Desktop Preload Script
 * Exposes safe, isolated native APIs for SQLite disk persistence, logging, and system integration.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gymDesktopApi', {
  isDesktop: true,
  platform: process.platform,

  getAppPaths: () => ipcRenderer.invoke('desktop:getAppPaths'),

  readDatabaseFile: (path) => ipcRenderer.invoke('desktop:readDatabaseFile', path),

  writeDatabaseFile: (path, bytes) => ipcRenderer.invoke('desktop:writeDatabaseFile', path, bytes),

  writeDatabaseFileSync: (path, bytes) => ipcRenderer.send('desktop:writeDatabaseFileSync', path, bytes),

  createBackup: () => ipcRenderer.invoke('desktop:createBackup'),

  restoreBackup: (backupPath) => ipcRenderer.invoke('desktop:restoreBackup', backupPath),

  // Licensing & Hardware-bound Activation
  getLicenseStatus: (options) => ipcRenderer.invoke('desktop:getLicenseStatus', options),
  validateStartupLicense: (options) => ipcRenderer.invoke('desktop:validateStartupLicense', options),
  activateLicense: (licenseKey) => ipcRenderer.invoke('desktop:activateLicense', licenseKey),
  deactivateLicense: () => ipcRenderer.invoke('desktop:deactivateLicense'),
  activateOfflinePackage: (packageData) => ipcRenderer.invoke('desktop:activateOfflinePackage', packageData),
  recoverLicense: (licenseKey, recoveryCode) => ipcRenderer.invoke('desktop:recoverLicense', licenseKey, recoveryCode),
  getDeviceFingerprint: () => ipcRenderer.invoke('desktop:getDeviceFingerprint'),
  getRawDeviceFingerprint: () => ipcRenderer.invoke('desktop:getRawDeviceFingerprint'),

  log: (level, message, meta) => ipcRenderer.send('desktop:log', { level, message, meta }),

  onBeforeQuit: (callback) => {
    ipcRenderer.on('app:before-quit', () => callback());
  },
});
