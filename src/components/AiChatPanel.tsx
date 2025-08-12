import { AiChat } from "@liveblocks/react-ui";

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
        className="[--lb-ai-chat-container-width:500px]"
      />
    </div>
  );
}
