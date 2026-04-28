import Aside from "../../components/Aside/Aside.jsx";
import ChatInput from "../../components/Chat/ChatInput/ChatInput.jsx";
import ChatMessages from "../../components/Chat/ChatMessages.jsx";
import useAutoScroll from "../../hooks/useAutoScroll.jsx";
import { PanelLeftOpen, ArrowDown, MessageSquarePlus } from "lucide-react";
// import "./index.scss";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import cn from "classnames";

import testContent from "../../components/Chat/AIMessage/test.md?raw";

function buildApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
  return `${base}${path}`;
}

function createMessage(id, role, content) {
  return { id, role, content };
}

function parseSseEvent(block) {
  const lines = block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  let event = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
}

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [isAsideShown, setAsideShown] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const {
    containerRef,
    endRef,
    autoScroll,
    scrollToBottom,
    setAutoScroll,
    setUserScrolled,
    checkIfAtBottom,
  } = useAutoScroll([messages]);
  const abortRef = useRef(null);
  const threadId = useMemo(() => `session_${Date.now()}`, []);

  function appendAssistantChunk(chunk) {
    setMessages((current) => {
      if (current.length === 0) {
        return current;
      }

      const next = [...current];
      const last = next[next.length - 1];
      if (last.role !== "assistant") {
        return current;
      }

      next[next.length - 1] = {
        ...last,
        content: `${last.content}${chunk}`,
      };
      return next;
    });
  }

  const sendMessage = async (input) => {
    const question = input.trim();
    if (!question || isStreaming) {
      return;
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now()}`;

    setIsStreaming(true);
    setMessages((current) => [
      ...current,
      createMessage(userMessageId, "user", question),
      createMessage(assistantMessageId, "assistant", ""),
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({
      message: question,
      thread_id: threadId,
      user_id: "frontend_user",
    });

    try {
      const response = await fetch(
        buildApiUrl(`/api/agents/chat?${params.toString()}`),
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
          signal: controller.signal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          const parsed = parseSseEvent(rawEvent);
          if (parsed.event === "done") {
            setIsStreaming(false);
            abortRef.current = null;
            return;
          }

          if (parsed.event === "error") {
            let detail = parsed.data;
            try {
              const payload = JSON.parse(parsed.data);
              if (payload?.error) {
                detail = payload.error;
              }
            } catch {
              // Keep raw error text.
            }
            throw new Error(detail || "Stream error");
          }

          if (parsed.event === "message" && parsed.data) {
            try {
              const payload = JSON.parse(parsed.data);
              if (typeof payload?.v === "string") {
                appendAssistantChunk(payload.v);
              }
            } catch {
              // Ignore malformed message chunks.
            }
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      console.error("Error occurred while fetching stream:", error);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setMessages((current) => [
        createMessage("adadfasd", "user", "question"),
        createMessage("222asdfaxc", "assistant", testContent),
      ]);
    }, 1000);
  }, []);

  const handleGotoEnd = useCallback(() => {
    if (isStreaming) {
      endRef.current?.scrollIntoView();
    } else {
      scrollToBottom();
    }
  }, [isStreaming]);

  const handleSubmit = (input) => {
    setUserScrolled(false);
    setAutoScroll(true);
    sendMessage(input);
  };
  const handleStop = () => {
    setIsStreaming(false);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };
  return (
    <div className="w-full h-full flex overflow-hidden">
      <div
        className={cn(
          isAsideShown ? "w-65" : "w-0",
          "h-full min-w-0 overflow-hidden transition-[width] duration-260 ease",
        )}
      >
        <Aside isAsideShown={isAsideShown} setAsideShown={setAsideShown} />
      </div>
      <div className="h-full flex overflow-hidden flex-1">
        <div className="h-full flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="h-15 min-h-15 flex items-center pt-0 pb-0 pl-3 pr-3">
            {!isAsideShown && (
              <div className="flex mr-2">
                <button
                  className="icon-btn"
                  onClick={() => setAsideShown(true)}
                >
                  <PanelLeftOpen size={22} strokeWidth={1} />
                </button>
                <button className="icon-btn">
                  <MessageSquarePlus size={22} strokeWidth={1} />
                </button>
              </div>
            )}
            <div>Qwen3.5-千问</div>
          </div>
          <div className="flex flex-1 h-full justify-center overflow-hidden">
            <div className="w-full h-full flex flex-col items-center">
              <div className="flex-1 w-full relative overflow-hidden">
                <div
                  className="w-full h-full relative overflow-y-scroll scrollbar-hide flex flex-col items-center"
                  ref={containerRef}
                >
                  <ChatMessages
                    messages={messages}
                    isStreaming={isStreaming}
                    errorText={null}
                  />
                  <div className="w-full h-0" ref={endRef} />
                </div>
                {!checkIfAtBottom() && !autoScroll && (
                  <div
                    className={cn(
                      "flex items-center justify-center cursor-pointer text-gray-500 transition-all duration-160 ease absolute left-[50%] -translate-x-1/2 bottom-5 w-8 h-8 rounded-2xl border border-gray-200",
                      "hover:bg-gray-50 hover:border-blue-400 hover:text-blue-400 font-size-12 bg-white",
                    )}
                    onClick={() => handleGotoEnd()}
                  >
                    <ArrowDown />
                  </div>
                )}
              </div>
              <div className="max-w-200 w-[calc(100%-48px)]">
                <ChatInput
                  isStreaming={isStreaming}
                  handleSubmit={handleSubmit}
                  handleStop={handleStop}
                />
              </div>
              <div className="text-gray-400 text-xs mt-3 pb-2">
                <h1>内容由AI生成，可能不准确，请注意核实</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="reference"></div>
      </div>
    </div>
  );
};
ChatView.displayName = "ChatView";
export default ChatView;
