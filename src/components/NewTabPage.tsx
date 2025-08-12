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
    // <div className="flex h-full w-[1000px] min-w-0 items-center justify-center text-gray-600">
    <div className="w-[600px] max-w-full p-12 text-center">
      <div className="mb-6 text-3xl font-light text-gray-600">How can I help you?</div>
      <div className="mb-8">
        {/* Example of a React-friendly styled input for "Ask anything..." */}
        <div className="relative">
          <div
          // className="absolute inset-0"
          // style={{
          //   boxShadow: "0 0 0 1px #0000000a, 0 2px 6px #0000000d, 0 8px 26px #0000000f",
          // }}
          />
          <form
            className="lb-root lb-ai-composer lb-ai-composer-form lb-ai-chat-composer lb-elevation lb-elevation-moderate rounded-[14px]"
            dir="ltr"
            style={
              {
                // boxShadow: "0 0 0 1px #0000000a, 0 2px 6px #0000000d, 0 8px 26px #0000000f",
              }
            }
            onSubmit={(e) => {
              e.preventDefault();
              const value = (e.currentTarget.elements.namedItem("search") as HTMLInputElement)
                ?.value;
              if (value) handleSearchSubmit(value);
            }}
          >
            <div className="lb-ai-composer-editor-container">
              <input
                name="search"
                type="text"
                autoComplete="off"
                aria-label="Composer editor"
                className="lb-ai-composer-editor"
                placeholder="Ask anything…"
                style={{
                  position: "relative",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  minHeight: 21,
                  width: "100%",
                  outline: "none",
                  border: "none",
                  background: "transparent",
                  fontSize: "1rem",
                  textAlign: "left",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit(e.currentTarget.value);
                  }
                }}
              />
              <div className="lb-ai-composer-footer">
                <div className="lb-ai-composer-editor-actions"></div>
                <div className="lb-ai-composer-actions">
                  <button
                    type="submit"
                    className="lb-button lb-ai-composer-action"
                    data-variant="primary"
                    data-size="default"
                    aria-label="Send"
                  >
                    <span className="lb-icon-container">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        role="presentation"
                        className="lb-icon"
                      >
                        <path d="m5 16 12-6L5 4l2 6-2 6ZM7 10h10"></path>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      {/* <div className="grid grid-cols-4 gap-4 text-sm">
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
        </div> */}
    </div>
    // </div>
  );
}
