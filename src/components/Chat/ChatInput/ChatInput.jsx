import { Globe, Atom, ArrowUp } from "lucide-react";
import { useCallback, useState } from "react";
import cn from "classnames";

const ChatInput = ({ isStreaming, handleSubmit, handleStop }) => {
  const [input, setInput] = useState("");

  const hasInput = useMemo(() => {
    return input.trim().length > 0;
  }, [input]);

  const onSubmit = () => {
    handleSubmit(input);
    setInput("");
  };

  return (
    <div className="w-full h-full">
      <div className="bg-background w-full h-full flex flex-col border border-gray-200 overflow-hidden rounded-[20px] px-3 py-0">
        <textarea
          className="text-md placeholder-gray-300 scrollbar-thin w-full h-full field-sizing-content min-h-16 max-h-50 border-none resize-none pt-3 pr-1 focus:outline-none"
          value={input}
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
            {!isStreaming ? (
              <button
                onClick={() => onSubmit()}
                type="button"
                className={cn(
                  "w-8 h-8 flex items-center justify-center bg-blue-300 text-background rounded-[50%] transition-all duration-260",
                  !hasInput
                    ? "cursor-not-allowed bg-gray-300"
                    : "cursor-pointer hover:bg-primary",
                )}
              >
                <ArrowUp />
              </button>
            ) : (
              <button
                type="button"
                className={cn(
                  "w-8 h-8 flex items-center justify-center bg-blue-400 text-background rounded-[50%] cursor-pointer transition-all duration-260 hover:bg-primary",
                )}
                onClick={() => handleStop()}
              >
                <span
                  className={cn("inline-block w-3 h-3 bg-background")}
                ></span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ChatInput.displayName = "ChatInput";
export default ChatInput;
