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
        setTimeout(() => sendAiMessage(value));
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
      <div
        className="-mt-6 mb-2.5 text-[45px] font-medium text-gray-600"
        style={{
          // fontFamily: "Inter Display",
          // fontFamily: "Minipax",
          fontFamily: "Aventine",
        }}
      >
        How can I help you?
      </div>
      <div className="">
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
      <div className="mx-0 ml-1 mt-4 flex items-center justify-between text-[13px] font-medium text-gray-500/80">
        <div className="flex items-center">
          <svg
            className="-mb-px mr-0.5 block size-5 text-gray-400/70"
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
          Type a web address or ask a question
        </div>
        <button
          onClick={() => onNavigate("https://liveblocks.io")}
          className="relative flex items-center gap-0.5 rounded px-2 py-1 ring-0 ring-black/10 before:-z-10 hover:bg-black/5 hover:text-gray-500"
        >
          liveblocks.io
          <RedirectIcon className="mb-0" />
        </button>
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
      {...props}
    >
      <path d="M7 7h10v10M7 17L17 7" />
    </svg>
  );
}
