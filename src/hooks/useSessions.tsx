import { useQuery } from "@tanstack/react-query";
import useChatStore, { Session } from "@/store/useChatStore";
import { chatApi } from "@/api/chat";
import { useEffect } from "react";
import { useParams } from "react-router";

const useSessions = () => {
  const loadSessions = useChatStore((s) => s.loadSessions);
  const setCurrentSession = useChatStore((s) => s.setCurrentSession);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const params = useParams<{ session_id: string }>();

  const { isPending, refetch, data } = useQuery<Session[]>({
    queryKey: ["getSessions"],
    queryFn: async () => {
      const res = await chatApi.get_sessions();
      return res?.sessions ?? [];
    },
  });

  useEffect(() => {
    loadSessions(data || []);
  }, [data]);

  useEffect(() => {
    setCurrentSession(params.session_id || "");
  }, [params.session_id]);

  return {
    sessions: data || [],
    isPending: isPending,
    setCurrentSession,
    currentSessionId,
    refetch,
  };
};

export default useSessions;
