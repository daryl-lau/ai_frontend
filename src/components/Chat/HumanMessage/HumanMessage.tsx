import { Trash, Copy, Check } from "lucide-react";
import { useState, useEffect, memo } from "react";

const HumanMessage: React.FC<{ message: string }> = memo(({ message }) => {
  const [copied, setCopied] = useState(false);

  const onCopyClick = () => {
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const btn = "w-5 h-5 cursor-pointer text-gray-400 hover:text-gray-500";
  return (
    <div className="group flex flex-col items-end w-full mb-1">
      <div className="py-2 px-3 rounded-lg bg-blue-200 inline-block max-w-[80%] whitespace-pre-wrap wrap-break-word">
        {message}
      </div>
      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-260">
        <button className={btn}>
          <Trash size={16} />
        </button>
        {copied ? (
          <button className={btn}>
            <Check size={16} />
          </button>
        ) : (
          <button onClick={() => onCopyClick()} className={btn}>
            <Copy size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

HumanMessage.displayName = "HumanMessage";
export default HumanMessage;
