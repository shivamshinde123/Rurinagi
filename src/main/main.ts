import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, nativeImage, Notification, Tray } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { AppState } from '../shared/domain';
import { backupDatabase, clearState, closeStorage, exportState, importState, loadState, openStorage, saveState } from './storage';

if (started) app.quit();

const databasePath = path.join(app.getPath('userData'), 'rurinagi.sqlite');
let mainWindow: BrowserWindow | null = null;
let captureWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let activeShortcut = '';
let isQuitting = false;

function rendererUrl(hash = ''): { url?: string; file?: string; options?: Electron.LoadFileOptions } {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) return { url: `${MAIN_WINDOW_VITE_DEV_SERVER_URL}${hash}` };
  return {
    file: path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    options: hash ? { hash: hash.slice(1) } : undefined,
  };
}

function loadRenderer(window: BrowserWindow, hash = ''): void {
  const target = rendererUrl(hash);
  if (target.url) void window.loadURL(target.url);
  else if (target.file) void window.loadFile(target.file, target.options);
}

function browserPreferences(): Electron.WebPreferences {
  return {
    preload: path.join(__dirname, 'preload.cjs'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  };
}

function appIconPath(): string {
  return app.isPackaged ? path.join(process.resourcesPath, 'rurinagi-logo.png') : path.join(app.getAppPath(), 'resources', 'rurinagi-logo.png');
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 980, minHeight: 680,
    title: 'Rurinagi', icon: appIconPath(), backgroundColor: '#F5F5F7', show: false,
    webPreferences: browserPreferences(),
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
    captureWindow?.destroy();
    captureWindow = null;
    if (process.platform !== 'darwin') app.quit();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  loadRenderer(mainWindow);
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  mainWindow?.show();
  mainWindow?.focus();
}

function createTray(): void {
  const icon = nativeImage.createFromPath(appIconPath()).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Rurinagi');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Rurinagi', click: showMainWindow },
    { label: 'Quick capture', click: openCapture },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on('double-click', showMainWindow);
}

function openCapture(): void {
  if (!captureWindow || captureWindow.isDestroyed()) {
    captureWindow = new BrowserWindow({
      width: 560, height: 390, minWidth: 480, minHeight: 340,
      title: 'Quick capture — Rurinagi', resizable: true,
      icon: appIconPath(), skipTaskbar: true, show: false, backgroundColor: '#F5F5F7',
      webPreferences: browserPreferences(),
    });
    captureWindow.on('close', (event) => {
      if (!isQuitting) { event.preventDefault(); captureWindow?.hide(); }
    });
    captureWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    loadRenderer(captureWindow, '#capture');
  }
  captureWindow.show();
  captureWindow.focus();
}

function configureShortcut(shortcut: string): void {
  if (activeShortcut) globalShortcut.unregister(activeShortcut);
  try {
    activeShortcut = globalShortcut.register(shortcut, openCapture) ? shortcut : '';
  } catch {
    activeShortcut = '';
  }
}

function broadcastState(): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('state:changed');
}

function applySystemSettings(state: AppState): void {
  app.setLoginItemSettings({ openAtLogin: state.settings.startWithWindows });
  if (state.settings.quickCaptureShortcut !== activeShortcut) configureShortcut(state.settings.quickCaptureShortcut);
}

function registerIpc(): void {
  ipcMain.handle('state:load', () => loadState());
  ipcMain.handle('state:save', (_event, state: unknown) => {
    const saved = saveState(state);
    applySystemSettings(saved);
    broadcastState();
    return saved;
  });
  ipcMain.handle('data:clear', () => { const state = clearState(); broadcastState(); return state; });
  ipcMain.handle('data:export', async () => {
    const result = await dialog.showSaveDialog({ title: 'Export Rurinagi data', defaultPath: 'rurinagi-export.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (result.canceled || !result.filePath) return { canceled: true };
    exportState(result.filePath);
    return { canceled: false, path: result.filePath };
  });
  ipcMain.handle('data:import', async () => {
    const result = await dialog.showOpenDialog({ title: 'Import Rurinagi data', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    const file = result.filePaths[0];
    if (result.canceled || !file) return { canceled: true };
    const state = importState(file); broadcastState(); return { canceled: false, state };
  });
  ipcMain.handle('data:backup', async () => {
    const result = await dialog.showSaveDialog({ title: 'Back up Rurinagi', defaultPath: 'rurinagi-backup.sqlite', filters: [{ name: 'SQLite database', extensions: ['sqlite'] }] });
    if (result.canceled || !result.filePath) return { canceled: true };
    backupDatabase(databasePath, result.filePath);
    return { canceled: false, path: result.filePath };
  });
  ipcMain.handle('capture:open', openCapture);
  ipcMain.handle('capture:complete', () => captureWindow?.hide());
  ipcMain.handle('notify', (_event, title: unknown, body: unknown) => {
    if (typeof title === 'string' && typeof body === 'string' && Notification.isSupported()) new Notification({ title: title.slice(0, 120), body: body.slice(0, 240) }).show();
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.rurinagi.app');
  openStorage(databasePath);
  registerIpc();
  createMainWindow();
  createTray();
  applySystemSettings(loadState());
  app.on('activate', showMainWindow);
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => { tray?.destroy(); tray = null; globalShortcut.unregisterAll(); closeStorage(); });
app.on('window-all-closed', () => app.quit());

