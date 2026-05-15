import HumanMessage from "./HumanMessage/HumanMessage.tsx";
import AIMessage from "./AIMessage/AIMessage.tsx";
import useChatStore from "@/store/useChatStore.tsx";
import cn from "classnames";
import React from "react";
import { useParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { ASSISTANT_ROLE, USER_ROLE } from "@/constants/index.ts";

const ChatMessages: React.FC = React.memo(() => {
  const { session_id } = useParams<{ session_id?: string }>();
  const messages = useChatStore(useShallow((state) => state.messagesMap[session_id || ""] || []));

  return (
    <>
      <div className="w-[calc(100%-48px)] max-w-200">
        {messages.map((message) => (
          <div key={message.id} className={cn("w-full", message.role === USER_ROLE && "flex justify-end")}>
            {message.role === ASSISTANT_ROLE ? (
              <AIMessage message={message.content} />
            ) : (
              <HumanMessage message={message.content} />
            )}
          </div>
        ))}
      </div>
    </>
  );
});
ChatMessages.displayName = "ChatMessages";
export default ChatMessages;
