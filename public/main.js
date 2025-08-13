import { app, BrowserWindow, WebContentsView, ipcMain, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let webContentsViews = new Map();
let activeViewId = null;
let contentBounds = { x: 0, y: 60, width: 1200, height: 740 };

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset", // Hide default title bar but keep traffic lights
    trafficLightPosition: { x: 18, y: 14 }, // Position the ●●● buttons
    vibrancy: "hud", // Add vibrancy effect
    visualEffectState: "active", // Ensure vibrancy is applied even when window is active
    backgroundColor: "#00000000", // Transparent background so frosted areas show vibrancy
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
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
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
ipcMain.handle("create-tab", (event, url = "https://www.google.com") => {
  const viewId = Date.now().toString();

  const webContentsView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Handle new window requests
  webContentsView.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Listen for navigation events to notify renderer about content changes
  webContentsView.webContents.on("did-finish-load", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tab-content-changed", viewId);
    }
  });

  webContentsView.webContents.on("did-navigate", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tab-content-changed", viewId);
    }
  });

  webContentsView.webContents.on("did-navigate-in-page", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tab-content-changed", viewId);
    }
  });

  // Intercept Cmd+R/Ctrl+R in the webview and delegate to our custom handler
  webContentsView.webContents.on("before-input-event", (event, input) => {
    if ((input.meta || input.control) && input.key.toLowerCase() === "r") {
      console.log("Intercepting Cmd+R/Ctrl+R in webview, delegating to custom handler");
      event.preventDefault();
      // Call our custom refresh handler
      handleTabRefresh(viewId);
    }
  });

  webContentsViews.set(viewId, webContentsView);

  // Set initial bounds (will be adjusted by renderer)
  webContentsView.setBounds(contentBounds);
  webContentsView.setBorderRadius(3);
  webContentsView.webContents.loadURL(url);

  // Don't add to window initially - will be added when switched to
  return {
    id: viewId,
    url: url,
    title: "Loading...",
  };
});

ipcMain.handle("switch-tab", (event, viewId) => {
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

ipcMain.handle("close-tab", (event, viewId) => {
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

ipcMain.handle("navigate-tab", (event, viewId, url) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    webContentsView.webContents.loadURL(url);
    return true;
  }
  return false;
});

ipcMain.handle("get-tab-info", async (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    let favicon = null;

    try {
      // Try to get favicon by executing JavaScript in the page
      favicon = await webContentsView.webContents.executeJavaScript(`
        (() => {
          // Look for favicon link elements
          const faviconLink = document.querySelector('link[rel*="icon"]');
          if (faviconLink && faviconLink.href) {
            return faviconLink.href;
          }
          
          // Fallback to default favicon.ico
          const url = new URL(window.location.href);
          return url.origin + '/favicon.ico';
        })();
      `);
    } catch (error) {
      // If JavaScript execution fails, try default favicon path
      try {
        const url = new URL(webContentsView.webContents.getURL());
        favicon = url.origin + "/favicon.ico";
      } catch (urlError) {
        favicon = null;
      }
    }

    return {
      url: webContentsView.webContents.getURL(),
      title: webContentsView.webContents.getTitle(),
      canGoBack: webContentsView.webContents.navigationHistory.canGoBack(),
      canGoForward: webContentsView.webContents.navigationHistory.canGoForward(),
      favicon: favicon,
    };
  }
  return null;
});

ipcMain.handle("tab-go-back", (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView && webContentsView.webContents.navigationHistory.canGoBack()) {
    webContentsView.webContents.navigationHistory.goBack();
    return true;
  }
  return false;
});

ipcMain.handle("tab-go-forward", (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView && webContentsView.webContents.navigationHistory.canGoForward()) {
    webContentsView.webContents.navigationHistory.goForward();
    return true;
  }
  return false;
});

ipcMain.handle("get-tab-content", async (event, viewId) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    try {
      // Execute JavaScript in the web page to get the HTML content
      const htmlContent = await webContentsView.webContents.executeJavaScript(`
        (() => {
          try {
            // Clone the document to avoid modifying the original
            const docClone = document.cloneNode(true);
            const bodyClone = docClone.body || docClone.documentElement;
            
            if (!bodyClone) return '';
            
            // Remove unwanted elements from the clone
            const unwantedSelectors = [
              'script', 'style', 'noscript', 'iframe', 'object', 'embed',
              'nav', 'header', 'footer', 'aside', 
              '.nav', '.navigation', '.menu', '.sidebar', '.advertisement', '.ad',
              '[class*="nav"]', '[class*="menu"]', '[class*="sidebar"]'
            ];
            
            unwantedSelectors.forEach(selector => {
              try {
                const elements = bodyClone.querySelectorAll(selector);
                elements.forEach(el => el.remove());
              } catch (e) {
                // Ignore selector errors
              }
            });
            
            // Get the cleaned HTML
            return bodyClone.innerHTML || bodyClone.textContent || '';
          } catch (error) {
            console.error('Error extracting content:', error);
            return document.body ? document.body.innerHTML : '';
          }
        })();
      `);

      return {
        html: htmlContent,
        url: webContentsView.webContents.getURL(),
        title: webContentsView.webContents.getTitle(),
      };
    } catch (error) {
      console.error("Error extracting content:", error);
      return null;
    }
  }
  return null;
});

let lastBounds = null;

// Handle tab refresh from keyboard shortcut
function handleTabRefresh(viewId) {
  console.log("handleTabRefresh called for viewId:", viewId);
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    console.log("WebContentsView found, calling reload()");
    webContentsView.webContents.reload();
    console.log("Reload called successfully");

    // Notify the React app that the tab is refreshing
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tab-refreshed", viewId);
    }
  } else {
    console.log("WebContentsView not found for viewId:", viewId);
  }
}

ipcMain.handle("layout-browserview", (event, bounds) => {
  // Skip if bounds haven't actually changed
  if (
    lastBounds &&
    lastBounds.x === bounds.x &&
    lastBounds.y === bounds.y &&
    lastBounds.width === bounds.width &&
    lastBounds.height === bounds.height
  ) {
    return true;
  }

  contentBounds = bounds;
  lastBounds = { ...bounds };

  // Update immediately for 60fps+ performance
  if (activeViewId) {
    const webContentsView = webContentsViews.get(activeViewId);
    if (webContentsView) {
      try {
        webContentsView.setBounds(contentBounds);
      } catch (error) {
        console.error("Error setting bounds:", error);
      }
    }
  }

  return true;
});

ipcMain.handle("set-tab-opacity", (event, viewId, opacity) => {
  const webContentsView = webContentsViews.get(viewId);
  if (webContentsView) {
    try {
      // Set truly transparent background when opacity is 0
      if (opacity === 0) {
        webContentsView.setBackgroundColor({
          red: 0,
          green: 0,
          blue: 0,
          alpha: 0,
        });
      } else {
        webContentsView.setBackgroundColor({
          red: 255,
          green: 255,
          blue: 255,
          alpha: Math.round(opacity * 255),
        });
      }

      // Make the web page itself transparent and handle click-through
      webContentsView.webContents.insertCSS(`
        html { 
          opacity: ${opacity} !important; 
          ${opacity === 0 ? "pointer-events: none !important;" : ""}
          ${opacity === 0 ? "background: transparent !important;" : ""}
        }
        ${
          opacity === 0
            ? `
          body { 
            background: transparent !important; 
          }
          * { 
            background-color: transparent !important; 
          }
        `
            : ""
        }
      `);

      // Set ignore mouse events for click-through when fully transparent
      if (opacity === 0) {
        // Hide the WebContentsView completely to show React element underneath
        if (activeViewId === viewId) {
          mainWindow.contentView.removeChildView(webContentsView);
        }
        webContentsView.webContents.setIgnoreMenuShortcuts(true);
      } else {
        // Restore the WebContentsView
        if (activeViewId === viewId) {
          mainWindow.contentView.addChildView(webContentsView);
          webContentsView.setBounds(contentBounds);
        }
        webContentsView.webContents.setIgnoreMenuShortcuts(false);

        // Restore mouse events
        try {
          webContentsView.webContents.executeJavaScript(`
            document.body.style.pointerEvents = 'auto';
            document.documentElement.style.pointerEvents = 'auto';
          `);
        } catch (jsError) {
          console.log("Could not execute pointer-events script:", jsError);
        }
      }

      return true;
    } catch (error) {
      console.error("Error setting tab opacity:", error);
      return false;
    }
  }
  return false;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
