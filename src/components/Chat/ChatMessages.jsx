import HumanMessage from "./HumanMessage/HumanMessage";
import AIMessage from "./AIMessage/AIMessage.jsx";
import cn from "classnames";

function ChatMessages({ messages, isStreaming, errorText }) {
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
              <AIMessage message={message.content} isStreaming={isStreaming} />
            ) : (
              <HumanMessage message={message.content} />
            )}
          </div>
        ))}
      </div>

      {errorText ? <p className="chat-error">{errorText}</p> : null}
    </>
  );
}

export default ChatMessages;
