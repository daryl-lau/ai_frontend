import { ArrowUp } from "lucide-react";
import { useState, useRef, useMemo, memo } from "react";
import { useIsStreaming, useIsTyping, useIsPending } from "@/store/index.tsx";
import cn from "classnames";

const ChatInput: React.FC<{
  handleSubmit: (value: string) => void;
  handleStop: () => void;
}> = memo(({ handleSubmit, handleStop }) => {
  const isStreaming = useIsStreaming((s: any) => s.isStreaming);
  const isTyping = useIsTyping((s: any) => s.isTyping);
  const isPending = useIsPending((s: any) => s.isPending);
  const textareaRef = useRef(null);
  const [input, setInput] = useState("");

  const hasInput = useMemo(() => {
    return input.trim().length > 0;
  }, [input]);

  const onSubmit = () => {
    handleSubmit(input);
    setInput("");
  };
  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isPending) return;
      e.preventDefault();
      handleStop();
      queueMicrotask(() => {
        onSubmit();
      });
    }
  };

  return (
    <div className="w-full h-full">
      <div
        className={cn(
          "w-full h-full px-4 py-0 flex flex-col overflow-hidden rounded-[20px]",
          "border border-gray-200 bg-background",
        )}
      >
        <textarea
          ref={textareaRef}
          className={cn(
            "text-md scrollbar-thin w-full h-full  min-h-16 max-h-50 pt-3 pr-1 ",
            "focus:outline-none field-sizing-content border-none resize-none placeholder-gray-300",
          )}
          value={input}
          onKeyDown={handleEnter}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="发送消息..."
        />
        <div className="flex justify-between py-2">
          <div className="flex gap-2 text-[16px]">
            {/* <button type="button" className="icon-text-btn">
              <Atom size={18} strokeWidth={1} />
              深度思考
            </button>
            <button type="button" className="icon-text-btn">
              <Globe size={18} strokeWidth={1} />
              智能搜索
            </button> */}
          </div>
          <div className="btns">
            {isStreaming || isTyping ? (
              <button
                type="button"
                className={cn(
                  "w-8 h-8 flex items-center justify-center bg-blue-400 text-background",
                  "rounded-[50%] cursor-pointer transition-all duration-260 hover:bg-primary",
                )}
                onClick={handleStop}
              >
                <span className={cn("inline-block w-3 h-3 bg-background")}></span>
              </button>
            ) : (
              <button
                onClick={() => onSubmit()}
                type="button"
                className={cn(
                  "w-8 h-8 flex items-center justify-center bg-blue-300 text-background",
                  "rounded-[50%] transition-all duration-260",
                  !hasInput || isPending ? "cursor-not-allowed bg-gray-300" : "cursor-pointer hover:bg-primary",
                )}
              >
                <ArrowUp />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
export default ChatInput;
