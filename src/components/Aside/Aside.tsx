import { memo, useState } from "react";
import { PanelRightOpen, MessageSquarePlus } from "lucide-react";
import { useNavigate } from "react-router";
import { useIsAsideShown, useUserStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import useChatStore, { Session } from "@/store/useChatStore";
import avator from "@/assets/imgs/avator-120-120.png";
import useSessions from "@/hooks/useSessions";
import SessionItem from "@/components/Aside/SessionItem";
import cn from "classnames";
import "./Aside.css";

const Aside = memo(() => {
  const isAsideShown = useIsAsideShown((s: any) => s.isAsideShown);
  const setAsideShown = useIsAsideShown((s: any) => s.setAsideShown);
  const userInfo = useUserStore((s: any) => s.userInfo);
  const navigate = useNavigate();
  const { sessions } = useSessions();

  const pinnedSessions = useChatStore(
    useShallow((s) =>
      s.sessions
        .filter((s) => s.is_pinned)
        .sort((a, b) => Number(new Date(b.updated_at)) - Number(new Date(a.updated_at))),
    ),
  );
  const unpinnedSessions = useChatStore(
    useShallow((s) =>
      s.sessions
        .filter((s) => !s.is_pinned)
        .sort((a, b) => Number(new Date(b.updated_at)) - Number(new Date(a.updated_at))),
    ),
  );
  const [triggerSession, setTriggerSession] = useState<string>("");

  console.log(pinnedSessions);

  return (
    <aside
      className={cn(
        "w-65 h-full bg-gray-50 border-gray-200 border-r overflow-hidden",
        "transition-transform duration-260 ease flex flex-col justify-between",
        isAsideShown ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div>
        <div className="flex h-15 justify-between items-center p-3">
          <div>
            <h1 className="text-primary font-bold text-xl">Deeps.cn</h1>
          </div>
          <div className="bar">
            <button className="icon-btn" onClick={() => setAsideShown(false)}>
              <PanelRightOpen size={22} strokeWidth={1} />
            </button>
          </div>
        </div>
        <div>
          <div
            onClick={() => navigate("/", { state: { newChat: true } })}
            className={cn(
              "select-none new-chat text-sm h-10 mx-3 mb-3 mt-1 rounded-md bg-white ",
              "flex items-center justify-center cursor-pointer",
            )}
          >
            <div className="mr-2">
              <MessageSquarePlus size={22} strokeWidth={1} />
            </div>
            <div>开启新对话</div>
          </div>
        </div>
      </div>
      <div className="relative flex-1 px-3 overflow-y-auto scrollbar-thin-hover">
        {sessions?.length === 0 ? (
          <div className="text-gray-300 text-sm flex justify-center">暂无对话</div>
        ) : (
          <div>
            <div className="px-2 text-[12px] text-gray-400 select-none">置顶</div>
            <div>
              {pinnedSessions.map(({ session_id, title, is_pinned }: Session) => (
                <SessionItem
                  key={session_id}
                  triggerSession={triggerSession}
                  setTriggerSession={setTriggerSession}
                  session_id={session_id}
                  title={title}
                  is_pinned={is_pinned}
                />
              ))}
            </div>
            <div className="px-2 pt-3 text-[12px] text-gray-400 select-none">当前</div>
            <div></div>
            {unpinnedSessions.map(({ session_id, title, is_pinned }: Session) => (
              <SessionItem
                key={session_id}
                triggerSession={triggerSession}
                setTriggerSession={setTriggerSession}
                session_id={session_id}
                title={title}
                is_pinned={is_pinned}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center cursor-pointer px-2 py-2 hover:bg-gray-100 rounded-md">
          <div className="w-7 h-7 rounded-[50%] overflow-hidden mr-3 select-none">
            <img src={userInfo?.avator ? userInfo?.avator : avator} alt="" />
          </div>
          <div className="font-bold select-none">{userInfo?.nickname}</div>
        </div>
      </div>
    </aside>
  );
});

Aside.displayName = "Aside";
export default Aside;
