import { Ellipsis, PencilLine, Pin, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { KeyboardEvent, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import useChatStore, { Session } from "@/store/useChatStore";
import Popover from "@/components/Popover";
import cn from "classnames";
import "./Aside.css";

interface SessionItemProps extends Omit<Session, "last_message_at" | "created_at"> {
  triggerSession: string;
  setTriggerSession: (session_id: string) => void;
}

interface UpdateTitleParams {
  session_id: string;
  title: string;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session_id,
  title,
  is_pinned,
  triggerSession,
  setTriggerSession,
}) => {
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const setCurrentSession = useChatStore((s) => s.setCurrentSession);
  const toggleSessionPin = useChatStore((s) => s.toggleSessionPin);
  const delSession = useChatStore((s) => s.delSession);
  const updateSessionTitle = useChatStore((s) => s.updateSessionTitle);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [value, setValue] = useState<string>(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const params = useParams();

  const update_title = useMutation({
    mutationFn: ({ session_id, title }: UpdateTitleParams) => {
      return chatApi.update_title({ session_id, title });
    },
    onSuccess: (_, vars) => {
      updateSessionTitle(vars.session_id, vars.title);
      stopEditing();
    },
    onError: (error) => {
      console.error("切换失败", error);
    },
  });

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

  const deleteSession = useMutation({
    mutationFn: (session_id: string) => {
      return chatApi.delete_session({ session_id });
    },
    onSuccess: (_, deletedSessionId) => {
      delSession(deletedSessionId);
      if (deletedSessionId == params.session_id) {
        navigate("/", { state: { newChat: true } });
      }
    },
    onError: (error) => {
      console.error("切换失败", error);
    },
  });

  const goto = (session_id: string) => {
    navigate(`/chat/${session_id}`, { state: { session_id } });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, session_id: string) => {
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

  const startEditing = () => {
    setEditingTitle(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      update_title.mutate({ session_id, title: value });
      stopEditing();
    }
    if (e.key === "Escape") {
      setValue(title);
      stopEditing();
    }
  };

  const handleBlur = () => {
    setValue(title);
    stopEditing();
  };

  const stopEditing = () => {
    setEditingTitle(false);
  };

  const sessionsOperate = (session_id: string, type: "rename" | "pin" | "unpin" | "delete") => {
    switch (type) {
      case "rename":
        startEditing();
        break;

      case "pin":
      case "unpin":
        toggle_pin.mutate(session_id);
        break;

      case "delete":
        deleteSession.mutate(session_id);
        break;
    }
  };
  const operateCls = "operate flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md";
  return (
    <>
      {editingTitle ? (
        <div
          className={cn("px-2 py-1 mb-0.5 text-sm rounded-md overflow-hidden border", "focus-within:border-primary")}
        >
          <input
            className="w-full outline-none leading-7.5"
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleSubmit}
          />
        </div>
      ) : (
        <div
          onClick={(e) => handleClick(e, session_id)}
          className={cn(
            "opacity-0  animate-[fadeIn_0.4s_ease-out_forwards] rounded-md py-1 px-2 mb-0.5",
            "cursor-pointer flex items-center justify-between hover:bg-gray-100 group",
            session_id == currentSessionId && "active",
            session_id == triggerSession && "trigger-active",
          )}
        >
          <div className="overflow-hidden h-8 leading-8 text-sm text-ellipsis text-nowrap select-none">
            <div>{title}</div>
          </div>
          <div
            className={cn(
              "pr-2 w-12 h-8 flex justify-end items-center",
              "absolute right-3 z-20 mask opacity-0 group-hover:opacity-100",
            )}
          >
            <Popover
              key={session_id}
              positions={["right"]} // 自动选择可用位置
              align="start"
              clickOutside={clickOutside}
              onContentClick={onContentClick}
              stopContentPropagation={true}
              transformMode="relative"
              transform={{ top: -12 }} // 微调位置
              content={
                <div>
                  <div onClick={() => sessionsOperate(session_id, "rename")} className={operateCls}>
                    <div className="mr-2">
                      <PencilLine size={16} strokeWidth={1} />
                    </div>
                    <div>重命名</div>
                  </div>
                  {is_pinned ? (
                    <div onClick={() => sessionsOperate(session_id, "unpin")} className={operateCls}>
                      <div className="mr-2">
                        <Pin size={16} strokeWidth={1} />
                      </div>
                      <div>取消置顶</div>
                    </div>
                  ) : (
                    <div onClick={() => sessionsOperate(session_id, "pin")} className={operateCls}>
                      <div className="mr-2">
                        <Pin size={16} strokeWidth={1} />
                      </div>
                      <div>置顶</div>
                    </div>
                  )}
                  <div onClick={() => sessionsOperate(session_id, "delete")} className={cn(operateCls, "text-red-500")}>
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
      )}
    </>
  );
};

export default SessionItem;
