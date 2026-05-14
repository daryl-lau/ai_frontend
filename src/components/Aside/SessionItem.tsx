import cn from "classnames";
import { Ellipsis, PencilLine, Pin, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import useChatStore, { Session } from "@/store/useChatStore";
import Popover from "../Popover";
import "./Aside.css";
import { useMutation } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";

interface SessionItemProps extends Session {
  idx: number;
  triggerSession: string;
  setTriggerSession: (session_id: string) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session_id,
  title,
  is_pinned,
  idx,
  triggerSession,
  setTriggerSession,
}) => {
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const setCurrentSession = useChatStore((s) => s.setCurrentSession);
  const toggleSessionPin = useChatStore((s) => s.toggleSessionPin);
  const navigate = useNavigate();

  const toggle_pin = useMutation({
    mutationFn: (session_id: string) => {
      return chatApi.toggle_pin({ session_id });
    },
    onSuccess: (_, variables) => {
      toggleSessionPin(variables);
    },
    onError: (error) => {
      console.error("切换失败", error);
    },
  });

  const goto = (session_id: string) => {
    navigate(`/chat/${session_id}`, { state: { session_id } });
  };

  const handleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    session_id: string,
  ) => {
    const target = e.target as Element;
    const triggerElement = target.closest(".popover-trigger");
    if (triggerElement) {
      setTriggerSession(session_id);
      return;
    }
    if (currentSessionId === session_id) return;
    setCurrentSession(session_id);
    goto(session_id);
  };

  const clickOutside = (e: MouseEvent) => {
    const target = e.target as Element;
    const triggerElement = target.closest(".popover-trigger");
    if (!triggerElement) {
      setTriggerSession("");
    }
  };

  const onContentClick = () => {
    setTriggerSession("");
  };

  const sessionsOperate = (
    session_id: string,
    type: "rename" | "pin" | "unpin" | "delete",
  ) => {
    switch (type) {
      case "rename":
        break;

      case "pin":
      case "unpin":
        toggle_pin.mutate(session_id);
        break;

      case "delete":
        break;
    }
  };

  return (
    <div
      onClick={(e) => handleClick(e, session_id)}
      style={{ animationDelay: `${idx * 15}ms` }}
      className={cn(
        "opacity-0 animate-[fadeIn_0.4s_ease-out_forwards] hover:bg-gray-100 group rounded-md mb-0.5  cursor-pointer flex items-center justify-between py-1 px-2",
        session_id == currentSessionId && "active",
        session_id == triggerSession && "trigger-active",
      )}
    >
      <div className="overflow-hidden h-8 leading-8 text-sm text-ellipsis text-nowrap select-none">
        <div>{title}</div>
      </div>
      <div
        className={cn(
          "absolute z-20 mask opacity-0 group-hover:opacity-100 right-3  pr-2  w-12 h-8 flex justify-end items-center",
        )}
      >
        <Popover
          key={session_id}
          positions={["right"]} // 自动选择可用位置
          align="start"
          clickOutside={clickOutside}
          onContentClick={onContentClick}
          transformMode="relative"
          transform={{ top: -12 }} // 微调位置
          content={
            <div>
              <div
                onClick={() => sessionsOperate(session_id, "rename")}
                className="operate flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md"
              >
                <div className="mr-2">
                  <PencilLine size={16} strokeWidth={1} />
                </div>
                <div>重命名</div>
              </div>
              {is_pinned ? (
                <div
                  onClick={() => sessionsOperate(session_id, "unpin")}
                  className="operate flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md"
                >
                  <div className="mr-2">
                    <Pin size={16} strokeWidth={1} />
                  </div>
                  <div>取消置顶</div>
                </div>
              ) : (
                <div
                  onClick={() => sessionsOperate(session_id, "pin")}
                  className="operate flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md"
                >
                  <div className="mr-2">
                    <Pin size={16} strokeWidth={1} />
                  </div>
                  <div>置顶</div>
                </div>
              )}
              <div
                onClick={() => sessionsOperate(session_id, "delete")}
                className="operate flex items-center px-3 py-1.5 text-md text-red-500 cursor-pointer hover:bg-gray-50 rounded-md"
              >
                <div className="mr-2">
                  <Trash2 size={16} strokeWidth={1} />
                </div>
                <div>删除</div>
              </div>
            </div>
          }
        >
          <div className=" hover:text-primary flex justify-end items-center px-1">
            <Ellipsis size={16} strokeWidth={1} />
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default SessionItem;
