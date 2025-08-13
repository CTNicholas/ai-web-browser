import { useSendAiMessage } from "@liveblocks/react";
import { AiChat, AiChatComponentsEmptyProps } from "@liveblocks/react-ui";

interface AiChatPanelProps {
  activeTabId: string;
  layout?: "compact" | "inset";
}

export function AiChatPanel({ activeTabId, layout = "compact" }: AiChatPanelProps) {
  return (
    <div className="absolute inset-0">
      <AiChat
        chatId={activeTabId}
        layout={layout}
        style={
          {
            "--lb-ai-chat-container-width": "500px",
          } as React.CSSProperties
        }
        components={{ Empty }}
      />
    </div>
  );
}

const suggestions = [
  {
    text: "Summarize",
    prompt: "Summarize this webpage and extract key insights",
  },
  {
    text: "Explain",
    prompt: "Explain the concepts on this page",
  },
  {
    text: "Learn more",
    prompt: "Tell me more about this topic",
  },
];

// Overriding the empty chat state function
function Empty({ chatId }: AiChatComponentsEmptyProps) {
  const sendMessage = useSendAiMessage(chatId, {
    copilotId: process.env.VITE_LIVEBLOCKS_COPILOT_ID || undefined,
  });

  return (
    <div className="mx-auto flex size-full max-w-[--inner-app-width] items-end px-4 pb-[calc(3*var(--lb-spacing))]">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-neutral-600">Suggestions</div>
        <div className="flex flex-wrap items-start gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              className="shadow-xs flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm font-medium transition-colors hover:bg-neutral-50"
              onClick={() => sendMessage(suggestion.prompt)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
