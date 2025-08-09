import React, { useState, useEffect, useRef } from 'react';
import { Tab } from './types';
import { useBrowserAPI } from './hooks/useBrowserAPI';
import TabBar from './components/TabBar';
import AddressBar from './components/AddressBar';
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react';

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabNavInfo, setTabNavInfo] = useState<{
    [key: string]: { canGoBack: boolean; canGoForward: boolean };
  }>({});
  const browserAPI = useBrowserAPI();

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

  // Helper to push current flex content bounds to Electron main
  const sendLayoutBounds = async () => {
    try {
      if (typeof window === 'undefined' || !window.require) return;
      const el = contentRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('layout-browserview', {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    } catch (e) {
      // no-op in web
    }
  };

  // Schedule bounds send on next paint (helps initial mount before layout stabilizes)
  const sendLayoutBoundsOnNextFrame = () => {
    try {
      if (typeof window === 'undefined') return;
      requestAnimationFrame(() => requestAnimationFrame(() => void sendLayoutBounds()));
    } catch {}
  };

  const createNewTab = async (url: string = 'https://www.google.com') => {
    if (!browserAPI) return;

    try {
      const result = await browserAPI.createTab(url);
      const newTab: Tab = {
        id: result.id,
        title: 'Loading...',
        url: result.url,
        isActive: true,
        isLoading: true,
      };

      setTabs((prev) => prev.map((t) => ({ ...t, isActive: false })).concat(newTab));
      setActiveTabId(result.id);
      await browserAPI.switchTab(result.id);
      sendLayoutBoundsOnNextFrame();

      // Update tab info after a short delay
      setTimeout(() => updateTabInfo(result.id), 1000);
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const switchToTab = async (tabId: string) => {
    if (!browserAPI || activeTabId === tabId) return;

    try {
      await browserAPI.switchTab(tabId);
      setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.id === tabId })));
      setActiveTabId(tabId);
      sendLayoutBoundsOnNextFrame();
      await updateTabInfo(tabId);
    } catch (error) {
      console.error('Failed to switch tab:', error);
    }
  };

  const closeTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!browserAPI) return;

    try {
      await browserAPI.closeTab(tabId);

      setTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);

        // If closing active tab, switch to another tab
        if (activeTabId === tabId && newTabs.length > 0) {
          const nextTab = newTabs[newTabs.length - 1];
          nextTab.isActive = true;
          setActiveTabId(nextTab.id);
          browserAPI.switchTab(nextTab.id);
          sendLayoutBoundsOnNextFrame();
        } else if (activeTabId === tabId) {
          setActiveTabId(null);
        }

        return newTabs;
      });
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  };

  const navigateTab = async (url: string) => {
    if (!browserAPI || !activeTabId) return;

    try {
      await browserAPI.navigateTab(activeTabId, url);
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, url, isLoading: true, title: 'Loading...' } : tab,
        ),
      );

      // Update tab info after navigation
      setTimeout(() => updateTabInfo(activeTabId), 1000);
    } catch (error) {
      console.error('Failed to navigate tab:', error);
    }
  };

  const updateTabInfo = async (tabId: string) => {
    if (!browserAPI) return;

    try {
      const info = await browserAPI.getTabInfo(tabId);
      if (info) {
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === tabId
              ? { ...tab, url: info.url, title: info.title || 'Untitled', isLoading: false }
              : tab,
          ),
        );

        setTabNavInfo((prev) => ({
          ...prev,
          [tabId]: {
            canGoBack: info.canGoBack,
            canGoForward: info.canGoForward,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to get tab info:', error);
    }
  };

  // Create initial tab
  useEffect(() => {
    if (browserAPI && tabs.length === 0) {
      createNewTab();
    }
  }, [browserAPI]);

  // Periodically update active tab info
  useEffect(() => {
    if (!activeTabId || !browserAPI) return;

    const interval = setInterval(() => {
      updateTabInfo(activeTabId);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTabId, browserAPI]);

  const currentNavInfo = activeTabId ? tabNavInfo[activeTabId] : null;

  // Report content area bounds to Electron main so BrowserView fills flex space
  useEffect(() => {
    if (typeof window === 'undefined' || !window.require) return;
    const { ipcRenderer } = window.require('electron');

    const updateBounds = () => {
      const el = contentRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      ipcRenderer.invoke('layout-browserview', {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };

    const ro = new ResizeObserver(() => updateBounds());
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener('resize', updateBounds);
    updateBounds();

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  if (!browserAPI) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <LiveblocksProvider authEndpoint="http://localhost:3002/liveblocks-auth">
      <RoomProvider id="browser-room" initialPresence={{}}>
        <div className="flex h-screen flex-col">
          <div className="p-2 pb-0 pl-24">
            <div className="relative flex h-8 flex-row justify-between">
              <div className="absolute inset-0" style={{ WebkitAppRegion: 'drag' } as any}></div>
              {/* <AddressBar
                activeTab={activeTab}
                onNavigate={navigateTab}
                canGoBack={currentNavInfo?.canGoBack}
                canGoForward={currentNavInfo?.canGoForward}
                onBack={async () => {
                  if (activeTabId && browserAPI) {
                    await browserAPI.goBack(activeTabId);
                    // Update tab info after navigation
                    setTimeout(() => updateTabInfo(activeTabId), 500);
                  }
                }}
                onForward={async () => {
                  if (activeTabId && browserAPI) {
                    await browserAPI.goForward(activeTabId);
                    // Update tab info after navigation
                    setTimeout(() => updateTabInfo(activeTabId), 500);
                  }
                }}
                onRefresh={() => {
                  if (activeTab) {
                    navigateTab(activeTab.url);
                  }
                }}
              /> */}
              <TabBar
                tabs={tabs}
                onTabClick={switchToTab}
                onTabClose={closeTab}
                onNewTab={() => createNewTab()}
              />
            </div>
          </div>
          <div className="m-2 mt-0 flex flex-1 flex-row gap-2 rounded-[5px] bg-white/70 p-2 shadow">
            <div className="relative flex-1 rounded-[3px] border border-neutral-200 shadow-sm">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                {/* Measured area for the BrowserView */}
                <div ref={contentRef} className="absolute inset-0" />

                {activeTab ? (
                  <div className="pointer-events-none flex h-full items-center justify-center text-neutral-500">
                    <div className="text-center">
                      <div className="mb-2 text-lg">{activeTab.title}</div>
                      <div className="text-sm">{activeTab.url}</div>
                      <div className="mt-4 text-xs text-neutral-400">
                        Web content is displayed here via Electron BrowserView
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-500">
                    <div className="text-center">
                      <div className="mb-4 text-lg">Welcome to AI Web Browser</div>
                      <button
                        onClick={() => createNewTab()}
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                      >
                        Create New Tab
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-[340px] rounded-[3px] border bg-white shadow-sm">
              <div className="p-4">
                <h3 className="mb-2 font-medium text-neutral-700">AI Chat</h3>
                <div className="text-sm text-neutral-500">AI assistant will appear here</div>
              </div>
            </div>
          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default App;
