import React, { useState, useEffect, useRef } from "react";
import { Tab } from "./types";
import { useBrowserAPI } from "./hooks/useBrowserAPI";
import { useWebpageContent } from "./hooks/useWebpageContent";
import { useOpacityToggle } from "./hooks/useOpacityToggle";
import TabBar from "./components/TabBar";
// import AddressBar from './components/AddressBar';
import {
  LiveblocksProvider,
  RegisterAiKnowledge,
  RegisterAiTool,
  RoomProvider,
} from "@liveblocks/react";
import { AiChat, AiTool } from "@liveblocks/react-ui";
import { defineAiTool } from "@liveblocks/client";

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabNavInfo, setTabNavInfo] = useState<{
    [key: string]: { canGoBack: boolean; canGoForward: boolean };
  }>({});
  const browserAPI = useBrowserAPI();
  const webpageContent = useWebpageContent(activeTabId);
  const { opacity, toggleOpacity } = useOpacityToggle(1, browserAPI, activeTabId);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;

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

      setTabs((prev) => prev.map((t) => ({ ...t, isActive: false })).concat(newTab));
      setActiveTabId(result.id);
      await browserAPI.switchTab(result.id);

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
      await browserAPI.closeTab(tabId);

      setTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);

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

  // Periodically update active tab info
  useEffect(() => {
    if (!activeTabId || !browserAPI) return;

    const interval = setInterval(() => {
      updateTabInfo(activeTabId);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTabId, browserAPI]);

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

    const updateBounds = () => {
      const el = contentRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      ipcRenderer.invoke("layout-browserview", {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };

    const ro = new ResizeObserver(() => updateBounds());
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", updateBounds);
    updateBounds();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateBounds);
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
        <div className="flex h-screen flex-col bg-gray-200/30">
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
              />
            </div>
          </div>
          <div className="m-2 mt-0 flex flex-1 flex-row gap-2 rounded-[5px] bg-white/70 p-2 shadow">
            <div className="relative flex-1 rounded-[3px] border border-gray-300/80 shadow-sm">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                {/* Measured area for the BrowserView */}
                <div ref={contentRef} className="pointer-events-none absolute inset-0" />

                {activeTab ? (
                  activeTab.url === "about:blank" ? (
                    <div className="flex h-full items-center justify-center text-neutral-600">
                      <div className="text-center">
                        <div className="mb-6 text-2xl font-light">New Tab</div>
                        <div className="mb-8">
                          <input
                            type="text"
                            placeholder="Search or enter web address"
                            className="w-96 rounded-lg border border-neutral-300/30 px-4 py-3 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const value = e.currentTarget.value.trim();
                                if (value) {
                                  const url =
                                    value.includes(".") && !value.includes(" ")
                                      ? value.startsWith("http")
                                        ? value
                                        : `https://${value}`
                                      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
                                  navigateTab(url);
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <button
                            onClick={() => navigateTab("https://www.google.com")}
                            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
                          >
                            <div className="mb-2 text-lg">🔍</div>
                            <div>Google</div>
                          </button>
                          <button
                            onClick={() => navigateTab("https://www.youtube.com")}
                            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
                          >
                            <div className="mb-2 text-lg">📺</div>
                            <div>YouTube</div>
                          </button>
                          <button
                            onClick={() => navigateTab("https://www.github.com")}
                            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
                          >
                            <div className="mb-2 text-lg">⚡</div>
                            <div>GitHub</div>
                          </button>
                          <button
                            onClick={() => navigateTab("https://www.twitter.com")}
                            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
                          >
                            <div className="mb-2 text-lg">🐦</div>
                            <div>Twitter</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pointer-events-none flex h-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-gray-800">
                      <div className="rounded-lg bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm">
                        <div className="mb-4 text-2xl">🌐</div>
                        <div className="mb-2 text-lg font-semibold">{activeTab.title}</div>
                        <div className="mb-4 break-all text-sm text-gray-600">{activeTab.url}</div>
                        <div className="text-xs text-gray-500">
                          React Element Below WebContentsView
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {opacity === 0
                            ? "👻 Click-through mode active"
                            : "Web content displayed via Electron BrowserView"}
                        </div>
                      </div>
                    </div>
                  )
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
            <div className="relative w-[340px] overflow-hidden rounded-[3px] border border-gray-300/80 bg-white shadow-sm">
              <div className="absolute inset-0">
                <AiChat chatId={activeTabId || "New tab"} layout="compact" />

                <RegisterAiKnowledge
                  description="The current web page's URL"
                  value={activeTab?.url || "No webpage open"}
                />

                <RegisterAiKnowledge
                  description="The current web page's markdown"
                  value={
                    webpageContent.isLoading
                      ? "Loading..."
                      : webpageContent.markdown || "The webpage is empty"
                  }
                />

                <RegisterAiTool
                  name="redirect-user"
                  tool={defineAiTool()({
                    description: "Navigate the user to a URL",
                    parameters: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          description: "The URL to navigate to (e.g. `https://www.google.com`)",
                        },
                        title: {
                          type: "string",
                          description: "Where you're going, (e.g. `Google`)",
                        },
                      },
                      required: ["url", "title"],
                      additionalProperties: false,
                    },
                    execute: async ({ url }) => {
                      navigateTab(url);
                      return { data: {}, description: "Navigated to " + url };
                    },
                    render: ({ args, stage }) =>
                      args ? (
                        <AiTool
                          icon={<RedirectIcon />}
                          title={`${stage === "executed" ? "Navigated" : "Navigating"} to ${args.title}`}
                        />
                      ) : null,
                  })}
                />

                <RegisterAiTool
                  name="redirect-user-on-confirm"
                  tool={defineAiTool()({
                    description: "Ask the user if they'd like to navigate to a URL",
                    parameters: {
                      type: "object",
                      properties: {
                        url: {
                          type: "string",
                          description: "The URL to navigate to (e.g. `https://www.google.com`)",
                        },
                        title: {
                          type: "string",
                          description: "Where you're going, (e.g. `Google`)",
                        },
                      },
                      required: ["url", "title"],
                      additionalProperties: false,
                    },
                    render: ({ args, stage }) =>
                      args ? (
                        <AiTool
                          icon={<RedirectIcon />}
                          title={`${stage === "executed" ? "Navigated" : "Navigating"} to ${args.title}`}
                        >
                          <AiTool.Confirmation
                            confirm={async () => {
                              navigateTab(args.url);
                              return { data: {}, description: "Navigated to " + args.url };
                            }}
                            cancel={async () => {
                              return {
                                data: {},
                                description: "User cancelled navigating to " + args.url,
                              };
                            }}
                          >
                            <div className="font-mono text-xs">{args.url}</div>
                          </AiTool.Confirmation>
                        </AiTool>
                      ) : null,
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RedirectIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className=""
      {...props}
    >
      <path d="M15 10l5 5-5 5" />
      <path d="M4 4v7a4 4 0 004 4h12" />
    </svg>
  );
}
export default App;
