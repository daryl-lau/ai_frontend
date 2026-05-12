import HumanMessage from "./HumanMessage/HumanMessage.tsx";
import AIMessage from "./AIMessage/AIMessage.tsx";
import useChatStore, { Message } from "@/store/useChatStore.tsx";
import cn from "classnames";
import React from "react";

const ChatMessages: React.FC = React.memo(() => {
  const messages = [] as Message[];

  return (
    <>
      <div className="w-[calc(100%-48px)] max-w-200">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "w-full",
              message.role == "user" && "flex justify-end",
            )}
          >
            {message.role === "assistant" ? (
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
