import React from "react";
import { AiTool } from "@liveblocks/react-ui";
import { RegisterAiKnowledge, RegisterAiTool } from "@liveblocks/react";
import { defineAiTool } from "@liveblocks/client";
import { turndownService } from "../utils/turndownService";
import { Tab } from "../types";

interface AiKnowledgeAndToolsProps {
  activeTabId: string;
  activeTabUrl?: string;
  webpageContent: {
    isLoading: boolean;
    markdown: string | null;
  };
  tabs: Tab[];
  onNavigate: (url: string) => void;
  onCreateNewTab?: (url: string) => void;
  onSwitchTab?: (tabId: string) => void;
  onCloseTabs?: (tabIds: string[]) => void;
}

export function AiKnowledgeAndTools({
  activeTabId,
  activeTabUrl,
  webpageContent,
  tabs,
  onNavigate,
  onCreateNewTab,
  onSwitchTab,
  onCloseTabs,
}: AiKnowledgeAndToolsProps) {
  return (
    <>
      <RegisterAiKnowledge
        description="The current web page's URL"
        value={activeTabUrl || "No webpage open"}
      />

      <RegisterAiKnowledge description="The current tab's id" value={activeTabId} />

      <RegisterAiKnowledge
        description="Today's time and date. Tell the user it in a pretty format"
        value={new Date().toISOString()}
      />

      <RegisterAiKnowledge
        description="The current web page's markdown"
        value={
          webpageContent.isLoading
            ? "Loading..."
            : webpageContent.markdown || "The webpage is empty"
        }
      />

      <RegisterAiKnowledge description="All open browser tabs" value={JSON.stringify(tabs)} />

      <RegisterAiTool
        name="redirect-user"
        tool={defineAiTool()({
          description:
            "Navigate the user to a URL in the current tab. Always use this when in a tab without a website open. Use it most of the other time too, unless a new tab feels relevant.",
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
            onNavigate(url);
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
                    onNavigate(args.url);
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

      <RegisterAiTool
        name="open-new-tab"
        tool={defineAiTool()({
          description: "Open a new tab and navigate to a specific URL",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to open in a new tab (e.g. 'https://example.com')",
              },
              title: {
                type: "string",
                description: "A description of where you're opening (e.g. 'Google Search')",
              },
            },
            required: ["url", "title"],
            additionalProperties: false,
          },
          execute: async ({ url, title }) => {
            try {
              // Validate and normalize URL
              let normalizedUrl = url.trim();
              if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
                normalizedUrl = "https://" + normalizedUrl;
              }

              // Create new tab with the URL
              if (onCreateNewTab) {
                await onCreateNewTab(normalizedUrl);
              } else {
                // Fallback - navigate current tab
                onNavigate(normalizedUrl);
              }

              return {
                data: {
                  url: normalizedUrl,
                  title: title,
                },
                description: `Opened new tab for ${title} at ${normalizedUrl}`,
              };
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error occurred";
              return {
                data: { error: errorMessage },
                description: `Failed to open new tab: ${errorMessage}`,
              };
            }
          },
          render: ({ args, stage }) =>
            args ? (
              <AiTool
                icon={<NewTabIcon />}
                title={`${stage === "executed" ? "Opened" : "Opening"} new tab for ${args.title}`}
              />
            ) : null,
        })}
      />

      <RegisterAiTool
        name="switch-tab"
        tool={defineAiTool()({
          description: "Switch to a specific browser tab",
          parameters: {
            type: "object",
            properties: {
              tabId: {
                type: "string",
                description: "The ID of the tab to switch to",
              },
              tabTitle: {
                type: "string",
                description: "The title of the tab being switched to (for display purposes)",
              },
            },
            required: ["tabId"],
            additionalProperties: false,
          },
          execute: async ({ tabId }) => {
            try {
              const targetTab = tabs.find((tab) => tab.id === tabId);

              if (!targetTab) {
                throw new Error(`Tab with ID "${tabId}" not found`);
              }

              if (targetTab.isActive) {
                return {
                  data: { tabId, title: targetTab.title },
                  description: `Already on tab "${targetTab.title}"`,
                };
              }

              if (onSwitchTab) {
                await onSwitchTab(tabId);
                return {
                  data: { tabId, title: targetTab.title },
                  description: `Switched to tab "${targetTab.title}"`,
                };
              } else {
                throw new Error("Tab switching is not available");
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error occurred";
              return {
                data: { error: errorMessage },
                description: `Failed to switch tab: ${errorMessage}`,
              };
            }
          },
          render: ({ args, result, stage }) =>
            args ? (
              <AiTool
                icon={<SwitchTabIcon />}
                title={
                  stage === "executed"
                    ? result?.data?.error
                      ? `Failed to switch to tab`
                      : `Switched to "${result?.data?.title || args.tabTitle || "tab"}"`
                    : `Switching to "${args.tabTitle || "tab"}"`
                }
              />
            ) : null,
        })}
      />

      <RegisterAiTool
        name="close-tabs"
        tool={defineAiTool()({
          description: "Close one or more browser tabs",
          parameters: {
            type: "object",
            properties: {
              tabIds: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Array of tab IDs to close",
              },
              tabTitles: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Array of tab titles being closed (for display purposes)",
              },
            },
            required: ["tabIds"],
            additionalProperties: false,
          },
          execute: async ({ tabIds }) => {
            try {
              if (!Array.isArray(tabIds) || tabIds.length === 0) {
                throw new Error("No tab IDs provided");
              }

              // Validate that all tabs exist
              const invalidTabs = tabIds.filter((id) => !tabs.find((tab) => tab.id === id));
              if (invalidTabs.length > 0) {
                throw new Error(`Tabs not found: ${invalidTabs.join(", ")}`);
              }

              // Check if we're closing all tabs
              const willCloseAllTabs = tabIds.length >= tabs.length;

              if (onCloseTabs) {
                // Check if the current active tab is being closed
                const activeTab = tabs.find((tab) => tab.isActive);
                const isClosingActiveTab = activeTab && tabIds.includes(activeTab.id);

                // Find a tab to switch to if we're closing the active tab
                let switchToTabId = null;
                if (isClosingActiveTab && tabs.length > tabIds.length) {
                  // Find the first tab that won't be closed
                  const remainingTab = tabs.find((tab) => !tabIds.includes(tab.id));
                  if (remainingTab) {
                    switchToTabId = remainingTab.id;
                  }
                }

                // Switch to another tab before closing if needed
                if (switchToTabId && onSwitchTab) {
                  await onSwitchTab(switchToTabId);
                }

                await onCloseTabs(tabIds);
                const closedTabs = tabs.filter((tab) => tabIds.includes(tab.id));
                const closedTitles = closedTabs.map((tab) => tab.title);

                let description = `Closed ${tabIds.length} tab${tabIds.length === 1 ? "" : "s"}: ${closedTitles.join(", ")}`;
                if (switchToTabId) {
                  const switchedToTab = tabs.find((tab) => tab.id === switchToTabId);
                  if (switchedToTab) {
                    description += ` and switched to "${switchedToTab.title}"`;
                  }
                }

                // If we closed all tabs, create a new one
                if (willCloseAllTabs && onCreateNewTab) {
                  onCreateNewTab("about:blank");
                  description += " and opened a new tab";
                }

                return {
                  data: {
                    closedTabIds: tabIds,
                    closedTitles: closedTitles,
                    count: tabIds.length,
                    switchedToTabId: switchToTabId,
                  },
                  description,
                };
              } else {
                throw new Error("Tab closing is not available");
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error occurred";
              return {
                data: { error: errorMessage },
                description: `Failed to close tabs: ${errorMessage}`,
              };
            }
          },
          render: ({ args, result, stage }) =>
            args ? (
              <AiTool
                icon={<CloseTabIcon />}
                title={
                  stage === "executed"
                    ? result?.data?.error
                      ? `Failed to close tabs`
                      : `Closed ${result?.data?.count || args.tabIds?.length || 0} tab${(result?.data?.count || args.tabIds?.length || 0) === 1 ? "" : "s"}`
                    : `Closing ${args.tabIds?.length || 0} tab${(args.tabIds?.length || 0) === 1 ? "" : "s"}`
                }
              >
                {result?.data?.error && (
                  <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    Error: {(result.data as any).error}
                  </div>
                )}
              </AiTool>
            ) : null,
        })}
      />

      <RegisterAiTool
        name="fetch-webpage-as-markdown"
        tool={defineAiTool()({
          description: "Fetch any webpage and convert it to markdown format",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  "The URL of the webpage to fetch and convert to markdown (e.g. 'https://example.com')",
              },
            },
            required: ["url"],
            additionalProperties: false,
          },
          execute: async ({ url }) => {
            try {
              // Validate and normalize URL
              let normalizedUrl = url.trim();
              if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
                normalizedUrl = "https://" + normalizedUrl;
              }

              // Fetch the webpage directly
              const response = await fetch(normalizedUrl, {
                mode: "cors",
                headers: {
                  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                  "User-Agent": "Mozilla/5.0 (compatible; AI Web Browser)",
                },
              });

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch webpage: ${response.status} ${response.statusText}`,
                );
              }

              const html = await response.text();

              if (!html) {
                throw new Error("No HTML content received from webpage");
              }

              // Extract title from HTML
              const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
              const title = titleMatch ? titleMatch[1].trim() : "Untitled";

              // Convert HTML to markdown
              const markdown = turndownService.turndown(html);

              return {
                data: {
                  url: normalizedUrl,
                  title: title,
                  markdown: markdown,
                  wordCount: markdown.split(/\s+/).length,
                },
                description: `Successfully fetched and converted "${title}" to markdown (${markdown.split(/\s+/).length} words)`,
              };
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error occurred";
              return {
                data: { error: errorMessage },
                description: `Failed to fetch webpage: ${errorMessage}`,
              };
            }
          },
          render: ({ args, result, stage }) => {
            if (!args) return null;

            return (
              <AiTool
                icon={<MarkdownIcon />}
                collapsed={true}
                title={
                  stage === "executed"
                    ? result?.data?.error
                      ? `Failed to fetch ${args.url}`
                      : `Fetched "${result?.data?.title || args.url}" as markdown`
                    : `Fetching ${args.url}`
                }
              >
                {/* {result?.data &&
                  typeof result.data === "object" &&
                  "markdown" in result.data &&
                  result.data.markdown && (
                    <div className="mt-2 max-h-96 overflow-y-auto rounded border bg-gray-50 p-3">
                      <div className="mb-2 text-xs text-gray-600">
                        {(result.data as any).wordCount} words • {(result.data as any).url}
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-sm">
                        {typeof (result.data as any).markdown === "string" &&
                        (result.data as any).markdown.length > 2000
                          ? (result.data as any).markdown.substring(0, 2000) +
                            "\n\n... (content truncated for display)"
                          : (result.data as any).markdown}
                      </pre>
                    </div>
                  )}
                {result?.data &&
                  typeof result.data === "object" &&
                  "error" in result.data &&
                  result.data.error && (
                    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                      Error: {(result.data as any).error}
                    </div>
                  )} */}
              </AiTool>
            );
          },
        })}
      />
    </>
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

function NewTabIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-plus-icon lucide-plus"
      {...props}
    >
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

function SwitchTabIcon(props: React.SVGProps<SVGSVGElement>) {
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
      className="lucide lucide-arrow-right-left-icon lucide-arrow-right-left"
      {...props}
    >
      <path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
    </svg>
  );
}

function CloseTabIcon(props: React.SVGProps<SVGSVGElement>) {
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
      className="lucide lucide-x-icon lucide-x"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function MarkdownIcon(props: React.SVGProps<SVGSVGElement>) {
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
      className="lucide lucide-search-icon lucide-search"
      {...props}
    >
      <path d="M21 21l-4.34-4.34" />
      <circle cx={11} cy={11} r={8} />
    </svg>
  );
}
