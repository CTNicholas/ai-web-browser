import { AiChatPanel } from "./AiChatPanel";
import { useCreateAiChat, useSendAiMessage } from "@liveblocks/react";

interface NewTabPageProps {
  tabId: string;
  onNavigate: (url: string) => void;
  showAiChat?: boolean;
  onShowAiChat?: (show: boolean) => void;
}

export function NewTabPage({
  tabId,
  onNavigate,
  showAiChat = false,
  onShowAiChat,
}: NewTabPageProps) {
  const createAiChat = useCreateAiChat();
  const sendAiMessage = useSendAiMessage(tabId, {
    copilotId: process.env.VITE_LIVEBLOCKS_COPILOT_ID,
  });

  const handleSearchSubmit = (value: string) => {
    if (value.trim()) {
      // Check if this looks like a URL (contains a dot and no spaces, or starts with http)
      const isUrl = (value.includes(".") && !value.includes(" ")) || value.startsWith("http");

      if (isUrl) {
        // It's a URL, navigate to it
        const url = value.startsWith("http") ? value : `https://${value}`;
        onNavigate(url);
      } else {
        // It's not a URL, show AI chat
        if (onShowAiChat) {
          onShowAiChat(true);
        }
        createAiChat(tabId);
        sendAiMessage(value);
      }
    }
  };

  if (showAiChat) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[3px] border border-gray-300/80 bg-white p-0 shadow-sm">
        <AiChatPanel activeTabId={tabId} layout="inset" />
      </div>
    );
  }

  return (
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
                handleSearchSubmit(e.currentTarget.value);
              }
            }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <button
            onClick={() => onNavigate("https://www.google.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">🔍</div>
            <div>Google</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.youtube.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">📺</div>
            <div>YouTube</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.github.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">⚡</div>
            <div>GitHub</div>
          </button>
          <button
            onClick={() => onNavigate("https://www.twitter.com")}
            className="rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-neutral-200"
          >
            <div className="mb-2 text-lg">🐦</div>
            <div>Twitter</div>
          </button>
        </div>
      </div>
    </div>
  );
}
