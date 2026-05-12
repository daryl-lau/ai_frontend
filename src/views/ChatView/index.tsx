import { PanelLeftOpen, ArrowDown, MessageSquarePlus } from "lucide-react";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import Aside from "@/components/Aside/Aside.tsx";
import ChatInput from "@/components/Chat/ChatInput/ChatInput.tsx";
import ChatMessages from "@/components/Chat/ChatMessages.tsx";
import { apiSseRequest, chatApi } from "@/api/chat.ts";
import { useQuery } from "@tanstack/react-query";
import { customAlphabet } from "nanoid";
import cn from "classnames";
import { useShallow } from "zustand/react/shallow";
import {
  useIsAsideShown,
  useIsPending,
  useIsStreaming,
  useIsTyping,
  useUserStore,
} from "@/store/index.tsx";
import "./index.css";

const generateThreadId = customAlphabet("0123456789abcdef", 32);

function createMessage(id: string, role: string, content: string) {
  return { id, role, content };
}

function parseSseEvent(block: string) {
  const lines = block
    .split("\n")
    .map((line: string) => line.trimEnd())
    .filter((line: string) => line.length > 0);

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
  const { isAsideShown, setAsideShown } = useIsAsideShown(
    useShallow((s: any) => ({
      isAsideShown: s.isAsideShown,
      setAsideShown: s.setAsideShown,
    })),
  );
  const { isStreaming, setIsStreaming } = useIsStreaming(
    useShallow((s: any) => ({
      isStreaming: s.isStreaming,
      setIsStreaming: s.setIsStreaming,
    })),
  );
  const { isTyping, setIsTyping } = useIsTyping(
    useShallow((s: any) => ({
      isTyping: s.isTyping,
      setIsTyping: s.setIsTyping,
    })),
  );
  const userInfo = useUserStore((s: any) => s.userInfo);
  const setIsPending = useIsPending((s: any) => s.setIsPending);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: string; content: string }>
  >([]);
  const [isBackToBtmShown, setBackToBtmShown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const session_id = useMemo(() => generateThreadId(), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null); // 存储 rAF ID 用于取消
  const isAutoScrolling = useRef(false); // 标记是否正在进行自动滚动
  const userScrolledUp = useRef(false); // 标记用户是否手动向上滚动了
  const navigate = useNavigate();
  const params = useParams<{ session_id?: string }>();
  const location = useLocation();

  const { data } = useQuery({
    queryKey: ["getMessages", location, params.session_id],
    enabled: !!(!location.state?.message && params.session_id),
    queryFn: async () => {
      const session_id = params.session_id;
      const res = await chatApi.get_messages({ session_id });
      return res?.messages ?? [];
    },
  });

  useEffect(() => {
    const newChat = location.state?.newChat;
    if (newChat) {
      setMessages([]);
      return;
    }
    const input = location.state?.message;
    const session_id = params.session_id;
    const user_id = userInfo?.user_id;
    if (input && session_id && user_id) {
      sendRequest(input, session_id, user_id);
    }
    return () => {
      window.history.replaceState({}, "", null);
    };
  }, [location]);

  useEffect(() => {
    if (data?.length > 0) {
      console.log("history messages", data);
      setMessages(data);
    }
  }, [data]);

  /**
   * 自适应平滑滚动函数
   */
  const smoothScrollToBottom = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // 检查用户意图：如果用户向上滚动了，不要自动滚动
    if (userScrolledUp.current) return;
    // 启动/继续动画
    const animate = () => {
      if (!containerRef.current) return;
      const currentPos = container.scrollTop;
      // 如果已经到底部（误差范围内），停止动画
      if (Math.abs(currentPos) <= 0) {
        isAutoScrolling.current = false;
        rafId.current = null;
        return;
      }

      const step = Math.floor(currentPos * 0.05);
      container.scrollTop = currentPos - step;
      rafId.current = requestAnimationFrame(animate);
    };

    if (!isAutoScrolling.current) {
      isAutoScrolling.current = true;
      animate();
    }
  };

  // 监听 wheel 事件
  const onMouseWhell = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      userScrolledUp.current = true;
    }
  };

  // 监听哨兵元素
  useEffect(() => {
    const sentinel = bottomAnchorRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // 当哨兵可见，说明底部在视口内，隐藏按钮
        if (entry.isIntersecting) {
          setBackToBtmShown(false);
          isAutoScrolling.current = false; // 用户回到了底部，恢复自动跟随模式
        } else {
          if (!isAutoScrolling.current) {
            setBackToBtmShown(true);
          }
        }
      },
      {
        root: container,
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, []);

  // 监听消息变化，触发滚动
  useEffect(() => {
    smoothScrollToBottom();
  }, [messages]);

  const streamWorkerRef = useRef<Worker | null>(null);
  useEffect(() => {
    const handleStream = (e: MessageEvent) => {
      const { type, chunks } = e.data;
      if (type == "TICK") {
        setIsTyping(true);
        setMessages((prevMessages) => {
          if (prevMessages.length === 0) return prevMessages;
          const lastMsg = prevMessages[prevMessages.length - 1];
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + chunks,
          };
          return newMessages;
        });
      }
      if (type == "IDLE") {
        setStreaming(false);
        setIsTyping(false);
      }
    };

    streamWorkerRef.current = new Worker(
      new URL("./Stream.js", import.meta.url),
      {
        type: "module",
      },
    );
    streamWorkerRef.current.addEventListener("message", handleStream);

    return () => {
      if (streamWorkerRef.current) {
        streamWorkerRef.current.removeEventListener("message", handleStream);
        streamWorkerRef.current.terminate();
        streamWorkerRef.current = null;
      }
    };
  }, []);

  function appendAssistantChunk(chunk: string) {
    if (streamWorkerRef.current) {
      streamWorkerRef.current.postMessage({ type: "APPEND_CHUNK", chunk });
    }
  }
  const setStreaming = (isStreaming: boolean) => {
    setIsStreaming(isStreaming);
    if (streamWorkerRef.current) {
      streamWorkerRef.current.postMessage({
        type: "SET_STREAM_STATUS",
        isStreaming: isStreaming,
      });
    }
  };

  const sendRequest = async (
    input: string,
    session_id: string,
    user_id: string,
  ) => {
    const question = input.trim();
    if (!question || isStreaming) {
      return;
    }
    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now()}`;

    // 发送用户消息，AI消息待生成
    setMessages((current) => [
      ...current,
      createMessage(userMessageId, "user", question),
      createMessage(assistantMessageId, "assistant", ""),
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const data = {
      message: question,
      session_id: session_id,
      user_id: user_id,
    };

    try {
      setIsPending(true);
      let buffer = "";
      let streamError = null;
      setStreaming(true);

      const response = await apiSseRequest(`/agents/chat`, {
        data,
        signal: controller.signal,
        onChunk: (textChunk) => {
          buffer += textChunk;
          let boundaryIndex = buffer.indexOf("\n\n");
          while (boundaryIndex !== -1) {
            const rawEvent = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + 2);
            const parsed = parseSseEvent(rawEvent);

            if (parsed.event === "done") {
              setStreaming(false);
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
              } catch {}
              streamError = new Error(detail || "Stream error");
              controller.abort();
              return;
            }

            if (parsed.event === "message" && parsed.data) {
              try {
                const payload = JSON.parse(parsed.data);
                if (typeof payload?.v === "string") {
                  appendAssistantChunk(payload?.v);
                }
              } catch {}
            }

            boundaryIndex = buffer.indexOf("\n\n");
          }
        },
      });

      setIsPending(false);
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Request failed (${response.status})`);
      }
      if (streamError) {
        throw streamError;
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setStreaming(false);
      setIsPending(false);
      abortRef.current = null;
    }
  };

  const handleGotoEnd = useCallback(() => {
    userScrolledUp.current = false;
    if (isTyping) {
      // 当在流式输出的时候，直接滚动到底部，不执行动画
      bottomAnchorRef.current?.scrollIntoView();
    } else {
      smoothScrollToBottom();
    }
  }, [isTyping]);

  const handleSubmit = useCallback(
    (input: string) => {
      if (params.session_id && userInfo?.user_id) {
        userScrolledUp.current = false;
        const session_id = params.session_id;
        console.log(input, session_id, userInfo.user_id);
        sendRequest(input, session_id, userInfo.user_id);
      } else {
        navigate(`/chat/${session_id}`, {
          state: { message: input, from: location.pathname },
        });
      }
    },
    [userInfo, params, location],
  );

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (streamWorkerRef.current) {
      streamWorkerRef.current.postMessage({
        type: "RESET",
      });
    }
    setIsStreaming(false);
    setIsPending(false);
    setIsTyping(false);
  }, []);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <div
        className={cn(
          isAsideShown ? "w-65" : "w-0",
          "h-full min-w-0 overflow-hidden transition-[width] duration-260 ease",
        )}
      >
        <Aside />
      </div>
      <div className="h-full flex overflow-hidden flex-1">
        <div className="h-full flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className=" h-15 min-h-15 flex items-center pt-0 pb-0 pl-3 pr-3">
            {!isAsideShown && (
              <div className="flex mr-2">
                <button
                  className="icon-btn"
                  onClick={() => setAsideShown(true)}
                >
                  <PanelLeftOpen size={22} strokeWidth={1} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => navigate("/", { state: { newChat: true } })}
                >
                  <MessageSquarePlus size={22} strokeWidth={1} />
                </button>
              </div>
            )}
            <div>{/* Qwen3.5-千问 */}</div>
          </div>
          <div className="flex flex-1 h-full justify-center overflow-hidden">
            <div className="relative w-full h-full flex flex-col items-center">
              <div className="flex-1 w-full relative overflow-hidden">
                <div
                  className="scrollbar-hide w-full h-full relative overflow-y-scroll flex flex-col-reverse items-center pb-5"
                  ref={containerRef}
                  onWheel={onMouseWhell}
                >
                  <div className="w-full h-0" ref={bottomAnchorRef} />
                  <ChatMessages />
                </div>
                {isBackToBtmShown && (
                  <div
                    className={cn(
                      "back-to-bottom flex items-center justify-center cursor-pointer text-gray-500 transition-all duration-160 ease absolute left-[50%] -translate-x-1/2 bottom-10 w-8 h-8 rounded-2xl border border-gray-200",
                      "hover:bg-gray-50 font-size-12 bg-white",
                    )}
                    onClick={() => handleGotoEnd()}
                  >
                    <div
                      className={cn(
                        "rotate-circle",
                        `opacity-${isTyping ? "100" : "0"}`,
                      )}
                    ></div>
                    <div>
                      <ArrowDown />
                    </div>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "max-w-200 w-[calc(100%-48px)] transition-translate-y duration-300 ease-out -mt-5 z-10",
                  !params.session_id &&
                    "absolute top-1/2 scale-95 -translate-y-full",
                )}
              >
                {!params.session_id && (
                  <div className="flex justify-center text-primary text-[28px] py-5">
                    欢迎使用Deeps.cn
                  </div>
                )}
                <div className="rounded-[20px] overflow-hidden transition-[height,max-height,border-color,box-shadow,border-radius, translate-y] duration-300 ease-out hover:shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.05)] focus-within:shadow-[0px_8px_16px_-4px_rgba(0,0,0,0.05)]">
                  <ChatInput
                    handleSubmit={handleSubmit}
                    handleStop={handleStop}
                  />
                </div>
              </div>
              <div className="text-gray-400 text-xs mt-3 pb-2">
                {!params.session_id && (
                  <h1>内容由AI生成，可能不准确，请注意核实</h1>
                )}
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
