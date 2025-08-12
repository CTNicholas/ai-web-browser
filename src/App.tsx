import React, { useState, useEffect, useRef } from "react";
import { Tab } from "./types";
import { useBrowserAPI } from "./hooks/useBrowserAPI";
import { useWebpageContent } from "./hooks/useWebpageContent";
import { useOpacityToggle } from "./hooks/useOpacityToggle";
import { TabBar } from "./components/TabBar";
import { NewTabPage } from "./components/NewTabPage";
import { AiChatPanel } from "./components/AiChatPanel";
// import AddressBar from './components/AddressBar';
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { AiKnowledgeAndTools } from "./components/AiKnowledgeAndTools";

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabAiChatVisible, setTabAiChatVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [tabNewPageAiChatVisible, setTabNewPageAiChatVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [tabNavInfo, setTabNavInfo] = useState<{
    [key: string]: { canGoBack: boolean; canGoForward: boolean };
  }>({});
  const browserAPI = useBrowserAPI();
  const webpageContent = useWebpageContent(activeTabId);
  const { opacity, toggleOpacity } = useOpacityToggle(1, browserAPI, activeTabId);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

  // Toggle AI chat visibility for current tab
  const toggleAiChat = () => {
    if (activeTabId) {
      setTabAiChatVisible((prev) => ({
        ...prev,
        [activeTabId]: !prev[activeTabId],
      }));
      // Trigger layout bounds update after state change
      sendLayoutBoundsOnNextFrame();
    }
  };

  // Get current tab's AI chat visibility (default to true for new tabs)
  const isCurrentTabAiChatVisible = activeTabId ? (tabAiChatVisible[activeTabId] ?? true) : true;

  // Helper to push current flex content bounds to Electron main
  const sendLayoutBounds = async () => {
    try {
      if (typeof window === "undefined" || !window.require) return;
      const el = contentRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const { ipcRenderer } = window.require("electron");
      await ipcRenderer.invoke("layout-browserview", {
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
      if (typeof window === "undefined") return;
      requestAnimationFrame(() => requestAnimationFrame(() => void sendLayoutBounds()));
    } catch {}
  };

  const createNewTab = async (url: string = "about:blank") => {
    if (!browserAPI) return;

    try {
      const result = await browserAPI.createTab(url);
      const newTab: Tab = {
        id: result.id,
        title: url === "about:blank" ? "New tab" : "Loading...",
        url: result.url,
        isActive: true,
        isLoading: url !== "about:blank",
      };

      // First switch to the new tab at the browser level
      await browserAPI.switchTab(result.id);

      // Update tabs state and ensure new tab is added at the end
      setTabs((prev) => {
        const updatedTabs = prev.map((t) => ({ ...t, isActive: false }));
        return [...updatedTabs, newTab];
      });

      // Set active tab ID after browser switch
      setActiveTabId(result.id);

      // Set opacity based on URL - 0 for about:blank, 1 for real websites
      const opacity = url === "about:blank" ? 0 : 1;
      await browserAPI.setTabOpacity(result.id, opacity);

      sendLayoutBoundsOnNextFrame();

      // Update tab info after a short delay
      setTimeout(() => updateTabInfo(result.id), 1000);
    } catch (error) {
      console.error("Failed to create tab:", error);
    }
  };

  const switchToTab = async (tabId: string) => {
    if (!browserAPI || activeTabId === tabId) return;

    try {
      await browserAPI.switchTab(tabId);
      setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: tab.id === tabId })));
      setActiveTabId(tabId);

      // Set opacity based on the tab's current URL
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        const opacity = tab.url === "about:blank" ? 0 : 1;
        await browserAPI.setTabOpacity(tabId, opacity);
      }

      sendLayoutBoundsOnNextFrame();
      await updateTabInfo(tabId);
    } catch (error) {
      console.error("Failed to switch tab:", error);
    }
  };

  const closeTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!browserAPI) return;

    try {
      // Check if this is the last tab before closing
      const willBeLastTab = tabs.length === 1;

      await browserAPI.closeTab(tabId);

      // If this was the last tab, clear tabs and create a new one
      if (willBeLastTab) {
        setTabs([]); // Clear all tabs first
        await createNewTab(); // Then create new tab
        return;
      }

      setTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);

        // Clean up AI chat state for closed tab
        setTabAiChatVisible((chatPrev) => {
          const newChatState = { ...chatPrev };
          delete newChatState[tabId];
          return newChatState;
        });
        setTabNewPageAiChatVisible((newPageChatPrev) => {
          const newNewPageChatState = { ...newPageChatPrev };
          delete newNewPageChatState[tabId];
          return newNewPageChatState;
        });

        // If closing active tab, switch to another tab
        if (activeTabId === tabId && newTabs.length > 0) {
          const nextTab = newTabs[newTabs.length - 1];
          nextTab.isActive = true;
          setActiveTabId(nextTab.id);
          browserAPI.switchTab(nextTab.id);

          // Set opacity based on the next tab's URL
          const opacity = nextTab.url === "about:blank" ? 0 : 1;
          browserAPI.setTabOpacity(nextTab.id, opacity);

          sendLayoutBoundsOnNextFrame();
        } else if (activeTabId === tabId) {
          setActiveTabId(null);
        }

        return newTabs;
      });
    } catch (error) {
      console.error("Failed to close tab:", error);
    }
  };

  const navigateTab = async (url: string) => {
    if (!browserAPI || !activeTabId) return;

    try {
      await browserAPI.navigateTab(activeTabId, url);
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, url, isLoading: true, title: "Loading..." } : tab,
        ),
      );

      // Set opacity based on URL - 0 for about:blank, 1 for real websites
      const opacity = url === "about:blank" ? 0 : 1;
      await browserAPI.setTabOpacity(activeTabId, opacity);

      // Update tab info after navigation
      setTimeout(() => updateTabInfo(activeTabId), 1000);
    } catch (error) {
      console.error("Failed to navigate tab:", error);
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
              ? {
                  ...tab,
                  url: info.url,
                  title: info.url === "about:blank" ? "New tab" : info.title || "Untitled",
                  isLoading: false,
                  favicon: info.favicon || "",
                }
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
      console.error("Failed to get tab info:", error);
    }
  };

  // Create initial tab
  useEffect(() => {
    if (browserAPI && tabs.length === 0) {
      createNewTab("https://www.google.com");
    }
  }, [browserAPI]);

  // Listen for tab refresh events from Electron main process
  useEffect(() => {
    if (typeof window === "undefined" || !window.require) return;

    try {
      const { ipcRenderer } = window.require("electron");

      const handleTabRefreshed = (event: any, viewId: string) => {
        console.log("Received tab-refreshed event for viewId:", viewId);
        // Mark tab as loading
        setTabs((prev) =>
          prev.map((tab) => (tab.id === viewId ? { ...tab, isLoading: true } : tab)),
        );

        // Update tab info after refresh
        setTimeout(() => updateTabInfo(viewId), 1000);
      };

      ipcRenderer.on("tab-refreshed", handleTabRefreshed);

      return () => {
        ipcRenderer.removeListener("tab-refreshed", handleTabRefreshed);
      };
    } catch (error) {
      console.error("Failed to set up tab refresh listener:", error);
    }
  }, [updateTabInfo]);

  // Periodically update active tab info
  useEffect(() => {
    if (!activeTabId || !browserAPI) return;

    const interval = setInterval(() => {
      updateTabInfo(activeTabId);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTabId, browserAPI]);

  // Update layout when AI chat visibility changes
  useEffect(() => {
    if (activeTabId) {
      // Small delay to allow React to finish rendering
      setTimeout(() => {
        sendLayoutBounds();
      }, 50);
    }
  }, [isCurrentTabAiChatVisible, activeTabId]);

  // Keyboard navigation controls
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isModKey = e.ctrlKey || e.metaKey;

      if (!isModKey) return;

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          if (tabs.length <= 1) return;

          const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
          if (currentIndex === -1) return;

          let nextIndex;
          if (e.shiftKey) {
            // Ctrl+Shift+Tab - Previous tab
            nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          } else {
            // Ctrl+Tab - Next tab
            nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
          }

          switchToTab(tabs[nextIndex].id);
          break;

        case "t":
          // Ctrl+T - New tab
          e.preventDefault();
          createNewTab();
          break;

        case "w":
          // Ctrl+W - Close current tab
          e.preventDefault();
          if (activeTabId && tabs.length > 1) {
            const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
            closeTab(activeTabId, syntheticEvent);
          }
          break;

        case "o":
          // Ctrl+O - Toggle opacity
          e.preventDefault();
          toggleOpacity();
          break;

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Ctrl+1-9 - Switch to specific tab
          e.preventDefault();
          const tabIndex = parseInt(e.key) - 1;
          if (tabIndex < tabs.length) {
            switchToTab(tabs[tabIndex].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [tabs, activeTabId, browserAPI, switchToTab, createNewTab, closeTab, toggleOpacity]);

  // const currentNavInfo = activeTabId ? tabNavInfo[activeTabId] : null;

  // Report content area bounds to Electron main so BrowserView fills flex space
  useEffect(() => {
    if (typeof window === "undefined" || !window.require) return;
    const { ipcRenderer } = window.require("electron");

    let rafId: number;
    let lastBounds = { x: 0, y: 0, width: 0, height: 0 };

    const updateBounds = () => {
      const el = contentRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const bounds = {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };

      // Only skip if bounds are exactly the same (let Electron handle micro-changes)
      if (
        bounds.x === lastBounds.x &&
        bounds.y === lastBounds.y &&
        bounds.width === lastBounds.width &&
        bounds.height === lastBounds.height
      ) {
        return;
      }

      lastBounds = { ...bounds };

      // Fire-and-forget for maximum performance - don't await
      ipcRenderer.invoke("layout-browserview", bounds);
    };

    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBounds);
    };

    const ro = new ResizeObserver(scheduleUpdate);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", scheduleUpdate);

    // Initial update
    scheduleUpdate();

    // Watch for AI chat visibility changes that might affect layout
    const aiChatContainer = document.querySelector("[data-ai-chat-container]");
    if (aiChatContainer) {
      ro.observe(aiChatContainer);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
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
        <AiKnowledgeAndTools
          activeTabId={activeTabId || "New tab"}
          activeTabUrl={activeTab?.url}
          webpageContent={webpageContent}
          tabs={tabs}
          onNavigate={navigateTab}
          onCreateNewTab={createNewTab}
          onSwitchTab={switchToTab}
          onCloseTabs={async (tabIds: string[]) => {
            for (const tabId of tabIds) {
              const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent;
              await closeTab(tabId, syntheticEvent);
            }
          }}
        />
        <div className="flex h-screen flex-col bg-gray-200/10">
          <div className="p-2 pb-0 pl-[93px]">
            <div className="relative flex h-8 flex-row justify-between">
              <div className="absolute inset-0" style={{ WebkitAppRegion: "drag" } as any}></div>
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
                onToggleAiChat={toggleAiChat}
                isAiChatVisible={isCurrentTabAiChatVisible}
                activeTab={activeTab}
              />
            </div>
          </div>
          <div className="m-2 mt-0 flex flex-1 flex-row gap-2 rounded-[5px] bg-white/80 p-2 shadow">
            <div ref={contentRef} className="pointer-events-none absolute inset-0" />
            {!activeTab || activeTab.url === "about:blank" ? (
              <div className="relative flex h-full w-full items-center justify-center">
                <NewTabPage
                  onNavigate={navigateTab}
                  tabId={activeTabId || ""}
                  showAiChat={activeTabId ? tabNewPageAiChatVisible[activeTabId] : false}
                  onShowAiChat={(show) => {
                    if (activeTabId) {
                      setTabNewPageAiChatVisible((prev) => ({
                        ...prev,
                        [activeTabId]: show,
                      }));
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative flex-1 rounded-[3px] border border-gray-300/80 shadow-sm">
                <div className="relative h-full w-full overflow-hidden rounded-lg">
                  {/* Measured area for the BrowserView */}
                  <div ref={contentRef} className="pointer-events-none absolute inset-0" />
                  <div className="h-full w-full bg-white">{/* Displays under webpages */}</div>
                </div>
              </div>
            )}
            {/* Only show AI chat when not on about:blank (new tab page) and when visible for current tab */}
            {activeTab && activeTab.url !== "about:blank" && isCurrentTabAiChatVisible && (
              <div
                data-ai-chat-container
                className="relative w-[340px] overflow-hidden rounded-[3px] border border-gray-300/80 bg-white shadow-sm"
              >
                <AiChatPanel activeTabId={activeTabId || "New tab"} layout="compact" />
              </div>
            )}
          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default App;
