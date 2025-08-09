import { app, BrowserWindow, BrowserView, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let browserViews = new Map();
let activeViewId = null;
let contentBounds = { x: 0, y: 60, width: 1200, height: 740 };

// --- Rounded-corner mask overlay ---
let maskWindow = null;

function syncMaskToContent() {
  if (!mainWindow || !maskWindow) return;
  // Use the content bounds so we account for title bar and frame offsets
  const contentArea = mainWindow.getContentBounds();
  maskWindow.setBounds({
    x: contentArea.x + contentBounds.x,
    y: contentArea.y + contentBounds.y,
    width: contentBounds.width,
    height: contentBounds.height,
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Hide default title bar but keep traffic lights
    trafficLightPosition: { x: 20, y: 13 }, // Position the ●●● buttons
    vibrancy: 'under-window', // Add vibrancy effect
    visualEffectState: 'active', // Ensure vibrancy is applied even when window is active
    backgroundColor: '#00000000', // Transparent background so frosted areas show vibrancy
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      cache: false, // Disable cache in development
    },
  });

  const startUrl = isDev
    ? `http://localhost:3000?t=${Date.now()}` // Cache bust with timestamp
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // --- MASK WINDOW (rounded corners over the BrowserView) ---
  maskWindow = new BrowserWindow({
    parent: mainWindow,
    modal: false,
    frame: false,
    transparent: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    backgroundColor: '#00000000',
    show: true,
    roundedCorners: false,
  });

  // Keep it above the BrowserView but let clicks pass through
  maskWindow.setIgnoreMouseEvents(true, { forward: true });

  const maskUrl = isDev
    ? `http://localhost:3000/mask.html`
    : `file://${path.join(__dirname, '../build/mask.html')}`;
  maskWindow.loadURL(maskUrl);

  // Sync position/size
  syncMaskToContent();
  mainWindow.on('move', syncMaskToContent);
  mainWindow.on('resize', syncMaskToContent);
  mainWindow.on('focus', syncMaskToContent);

  mainWindow.on('closed', () => {
    if (maskWindow) {
      try {
        maskWindow.close();
      } catch {}
    }
    maskWindow = null;
  });

  if (isDev) {
    // Don't auto-open DevTools, let user open manually with Cmd+Option+I

    // Force reload and clear cache
    mainWindow.webContents.session.clearCache();
    mainWindow.webContents.reloadIgnoringCache();
  }
}

// IPC handlers for tab management
ipcMain.handle('create-tab', (event, url = 'https://www.google.com') => {
  const viewId = Date.now().toString();

  const browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Set rounded corners using webContents setWindowOpenHandler
  browserView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  browserViews.set(viewId, browserView);

  // Set initial bounds (will be adjusted by renderer)
  browserView.setBounds(contentBounds);
  browserView.webContents.loadURL(url);

  // Hide initially
  mainWindow.setBrowserView(null);

  return {
    id: viewId,
    url: url,
    title: 'Loading...',
  };
});

ipcMain.handle('switch-tab', (event, viewId) => {
  const browserView = browserViews.get(viewId);
  if (browserView) {
    mainWindow.setBrowserView(browserView);
    activeViewId = viewId;

    // Use latest layout bounds from renderer
    browserView.setBounds(contentBounds);

    return true;
  }
  return false;
});

ipcMain.handle('close-tab', (event, viewId) => {
  const browserView = browserViews.get(viewId);
  if (browserView) {
    if (activeViewId === viewId) {
      mainWindow.setBrowserView(null);
      activeViewId = null;
    }
    browserView.webContents.destroy();
    browserViews.delete(viewId);
    return true;
  }
  return false;
});

ipcMain.handle('navigate-tab', (event, viewId, url) => {
  const browserView = browserViews.get(viewId);
  if (browserView) {
    browserView.webContents.loadURL(url);
    return true;
  }
  return false;
});

ipcMain.handle('get-tab-info', (event, viewId) => {
  const browserView = browserViews.get(viewId);
  if (browserView) {
    return {
      url: browserView.webContents.getURL(),
      title: browserView.webContents.getTitle(),
      canGoBack: browserView.webContents.canGoBack(),
      canGoForward: browserView.webContents.canGoForward(),
    };
  }
  return null;
});

ipcMain.handle('layout-browserview', (event, bounds) => {
  contentBounds = bounds;
  if (activeViewId) {
    const browserView = browserViews.get(activeViewId);
    if (browserView) {
      browserView.setBounds(contentBounds);
    }
  }
  // Keep the rounded mask in sync with content area
  syncMaskToContent();
  return true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
