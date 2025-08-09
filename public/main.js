import { app, BrowserWindow, WebContentsView, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let webContentsViews = new Map();
let activeViewId = null;
let contentBounds = { x: 0, y: 60, width: 1200, height: 740 };

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Hide default title bar but keep traffic lights
    trafficLightPosition: { x: 20, y: 14 }, // Position the ●●● buttons
    vibrancy: 'hud', // Add vibrancy effect
    visualEffectState: 'active', // Ensure vibrancy is applied even when window is active
    backgroundColor: '#00000000', // Transparent background so frosted areas show vibrancy
    roundedCorners: true, // Add rounded corners to the main window
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

  mainWindow.on('closed', () => {
    // Clean up web contents views
    for (const [viewId, webContentsView] of webContentsViews) {
      try {
        mainWindow.contentView.removeChildView(webContentsView);
        webContentsView.webContents.destroy();
      } catch {}
    }
    webContentsViews.clear();
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

  const webContentsView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Handle new window requests
  webContentsView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  webContentsViews.set(viewId, webContentsView);

  // Set initial bounds (will be adjusted by renderer)
  webContentsView.setBounds(contentBounds);
  webContentsView.setBorderRadius(3);
  webContentsView.webContents.loadURL(url);

  // Don't add to window initially - will be added when switched to
  return {
    id: viewId,
    url: url,
    title: 'Loading...',
  };
});

ipcMain.handle('switch-tab', (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    // Remove currently active view
    if (activeViewId && webContentsViews.has(activeViewId)) {
      const currentView = webContentsViews.get(activeViewId);
      mainWindow.contentView.removeChildView(currentView);
    }

    // Add the new view
    mainWindow.contentView.addChildView(webContentsView);
    activeViewId = viewId;

    // Use latest layout bounds from renderer
    webContentsView.setBounds(contentBounds);

    return true;
  }
  return false;
});

ipcMain.handle('close-tab', (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    if (activeViewId === viewId) {
      mainWindow.contentView.removeChildView(webContentsView);
      activeViewId = null;
    }
    webContentsView.webContents.destroy();
    webContentsViews.delete(viewId);
    return true;
  }
  return false;
});

ipcMain.handle('navigate-tab', (event, viewId, url) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    webContentsView.webContents.loadURL(url);
    return true;
  }
  return false;
});

ipcMain.handle('get-tab-info', (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    return {
      url: webContentsView.webContents.getURL(),
      title: webContentsView.webContents.getTitle(),
      canGoBack: webContentsView.webContents.navigationHistory.canGoBack(),
      canGoForward: webContentsView.webContents.navigationHistory.canGoForward(),
    };
  }
  return null;
});

ipcMain.handle('tab-go-back', (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView && webContentsView.webContents.navigationHistory.canGoBack()) {
    webContentsView.webContents.navigationHistory.goBack();
    return true;
  }
  return false;
});

ipcMain.handle('tab-go-forward', (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView && webContentsView.webContents.navigationHistory.canGoForward()) {
    webContentsView.webContents.navigationHistory.goForward();
    return true;
  }
  return false;
});

ipcMain.handle('layout-browserview', (event, bounds) => {
  contentBounds = bounds;
  if (activeViewId) {
    const webContentsView = webContentsViews.get(activeViewId);
    if (webContentsView) {
      webContentsView.setBounds(contentBounds);
    }
  }
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
