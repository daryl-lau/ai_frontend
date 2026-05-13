import { memo, type MouseEvent } from "react";
import { PanelRightOpen, MessageSquarePlus } from "lucide-react";
import { useNavigate } from "react-router";
import { useIsAsideShown, useUserStore } from "@/store";
import cn from "classnames";
import avator from "@/assets/imgs/avator-120-120.png";
import "./Aside.css";
import useSessions from "@/hooks/useSessions";
import { Session } from "@/store/useChatStore";

const Aside = memo(() => {
  const isAsideShown = useIsAsideShown((s: any) => s.isAsideShown);
  const setAsideShown = useIsAsideShown((s: any) => s.setAsideShown);
  const userInfo = useUserStore((s: any) => s.userInfo);
  const navigate = useNavigate();
  const { sessions, currentSessionId, setCurrentSession } = useSessions();

  // const { data } = useQuery<Session[]>({
  //   queryKey: ["getSessions"],
  //   queryFn: async () => {
  //     const res = await chatApi.get_sessions();
  //     return res?.sessions ?? [];
  //   },
  // });

  const handleClick = (_: MouseEvent<HTMLDivElement>, session_id: string) => {
    if (currentSessionId === session_id) return;
    setCurrentSession(session_id);
    goto(session_id);
  };

  const goto = (session_id: string) => {
    navigate(`/chat/${session_id}`, { state: { session_id } });
  };

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
            className="new-chat text-sm flex items-center justify-center h-10 mx-3 mb-3 mt-1 rounded-md cursor-pointer bg-white "
          >
            <div className="mr-2">
              <MessageSquarePlus size={22} strokeWidth={1} />
            </div>
            <div>开启新对话</div>
          </div>
        </div>
      </div>
      <div className="relative flex-1 px-3 overflow-y-auto scrollbar-thin-hover">
        {sessions?.length === 0 && (
          <div className="text-gray-300 text-sm flex justify-center">
            暂无对话
          </div>
        )}
        {sessions?.map(({ session_id, title }: Session) => (
          <div
            key={session_id}
            onClick={(e) => handleClick(e, session_id)}
            className={cn(
              "hover:bg-gray-100 group rounded-md mb-0.5  cursor-pointer flex items-center justify-between py-1 px-2",
              session_id == currentSessionId ? "active" : "",
            )}
          >
            <div className="overflow-hidden h-8 leading-8 text-sm text-ellipsis text-nowrap select-none">
              <span>{title}</span>
            </div>
            <div
              className={cn(
                "absolute z-20  mask opacity-0 group-hover:opacity-100 right-3  pr-2  w-12 h-8 flex justify-end items-center",
              )}
            >
              {/* <Popover
                positions={["right"]} // 自动选择可用位置
                align="start"
                transformMode="relative"
                transform={{ top: -12 }} // 微调位置
                content={
                  <div>
                    <div className=" flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md">
                      <div className="mr-2">
                        <PencilLine size={16} strokeWidth={1} />
                      </div>
                      <div>重命名</div>
                    </div>
                    <div className="flex items-center px-3 py-1.5 text-md cursor-pointer hover:bg-gray-50 rounded-md">
                      <div className="mr-2">
                        <Pin size={16} strokeWidth={1} />
                      </div>
                      <div>置顶</div>
                    </div>
                    <div className="flex items-center px-3 py-1.5 text-md text-red-500 cursor-pointer hover:bg-gray-50 rounded-md">
                      <div className="mr-2">
                        <Trash2 size={16} strokeWidth={1} />
                      </div>
                      <div>删除</div>
                    </div>
                  </div>
                } // 弹出的内容
              >
                <div
                  // onClick={(e) => {
                  //   setting(e, session_id);
                  // }}
                  className="hover:text-primary flex justify-end items-center px-1"
                >
                  <Ellipsis size={16} strokeWidth={1} />
                </div>
              </Popover> */}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center cursor-pointer px-2 py-2 hover:bg-gray-100 rounded-md">
          <div className="w-7 h-7 rounded-[50%] overflow-hidden mr-3">
            <img src={userInfo?.avator ? userInfo?.avator : avator} alt="" />
          </div>
          <div className="font-bold">{userInfo?.nickname}</div>
        </div>
      </div>
    </aside>
  );
});

Aside.displayName = "Aside";
export default Aside;
