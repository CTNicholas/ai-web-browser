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
    <div className="relative mx-auto flex size-full max-w-[--inner-app-width] items-end px-4 pb-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="">
          <svg
            className="pointer-events-none -mb-px mr-0.5 block size-[900px] rotate-[70deg] text-gray-300/10"
            fill="currentColor"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M21.657 8H2l5.657 5.6v7.733L21.657 8ZM10.343 24H30l-5.657-5.6v-7.733L10.343 24Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm text-neutral-600">Suggestions</div>
        <div className="z-10 flex flex-wrap items-start gap-1.5">
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
