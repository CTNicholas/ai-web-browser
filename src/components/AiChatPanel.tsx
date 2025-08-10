import React from "react";
import { AiChat, AiTool } from "@liveblocks/react-ui";
import { RegisterAiKnowledge, RegisterAiTool } from "@liveblocks/react";
import { defineAiTool } from "@liveblocks/client";

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

export default AiChatPanel;
