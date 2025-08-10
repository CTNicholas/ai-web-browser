import React from "react";
import { AiChat, AiTool } from "@liveblocks/react-ui";
import { RegisterAiKnowledge, RegisterAiTool } from "@liveblocks/react";
import { defineAiTool } from "@liveblocks/client";
import { turndownService } from "../utils/turndownService";

interface AiChatPanelProps {
  activeTabId: string;
  activeTabUrl?: string;
  webpageContent: {
    isLoading: boolean;
    markdown: string | null;
  };
  onNavigate: (url: string) => void;
}

const AiChatPanel: React.FC<AiChatPanelProps> = ({
  activeTabId,
  activeTabUrl,
  webpageContent,
  onNavigate,
}) => {
  return (
    <div className="absolute inset-0">
      <AiChat chatId={activeTabId} layout="compact" />

      <RegisterAiKnowledge
        description="The current web page's URL"
        value={activeTabUrl || "No webpage open"}
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
    </div>
  );
};

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

export default AiChatPanel;
