import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { ASSISTANT_ROLE, USER_ROLE } from "@/constants/index.ts";

export interface Message {
  id: string;
  role: typeof USER_ROLE | typeof ASSISTANT_ROLE;
  content: string;
}

export interface Session {
  session_id: string;
  title: string;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatStore {
  sessions: Session[];
  messagesMap: Record<string, Message[]>;
  currentSessionId: string | null;

  // 会话操作
  addSession: (session: Session) => void;
  delSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  loadSessions: (sessions: Session[]) => void;
  toggleSessionPin: (sessionId: string) => void;
  getPinnedSessions: () => Session[];
  getUnpinnedSessions: () => Session[];

  // 消息操作
  addMessage: (sessionId: string, message: Message) => void;
  loadMessages: (sessionId: string, messages: Message[]) => void;
  appendToLastMessage: (sessionId: string, content: string) => void;
}

const useChatStore = create<ChatStore>()(
  devtools(
    immer((set) => ({
      sessions: [],
      messagesMap: {},
      currentSessionId: null,

      // 会话操作
      addSession: (session) =>
        set((state) => {
          state.sessions.unshift(session);
          state.messagesMap[session.session_id] = [];
        }),

      loadSessions: (sessions: Session[]) => {
        set((state) => {
          state.sessions = sessions;
        });
      },

      toggleSessionPin: (sessionId) =>
        set((state) => {
          const index = state.sessions.findIndex((s) => s.session_id === sessionId);
          if (index !== -1) {
            state.sessions[index].is_pinned = !state.sessions[index].is_pinned;
            state.sessions[index].updated_at = new Date().toISOString();
          }
        }),

      delSession: (sessionId) =>
        set((state) => {
          const index = state.sessions.findIndex((s: any) => s.session_id === sessionId);
          if (index !== -1) {
            state.sessions.splice(index, 1);
          }
          delete state.messagesMap[sessionId];
          if (state.currentSessionId === sessionId) {
            state.currentSessionId = state.sessions[0]?.session_id || null;
          }
        }),

      setCurrentSession: (sessionId) =>
        set((state) => {
          state.currentSessionId = sessionId;
        }),

      updateSessionTitle: (sessionId, title) =>
        set((state) => {
          const session = state.sessions.find((s: any) => s.session_id === sessionId);
          if (session) {
            session.title = title;
          }
        }),

      // 消息操作
      addMessage: (sessionId, message) =>
        set((state) => {
          if (!state.messagesMap[sessionId]) {
            state.messagesMap[sessionId] = [];
          }
          state.messagesMap[sessionId].push(message);
        }),

      loadMessages: (sessionId, messages) => {
        set((state) => {
          state.messagesMap[sessionId] = messages;
        });
      },

      appendToLastMessage: (sessionId, content) => {
        set((state) => {
          const messages = state.messagesMap[sessionId];
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            lastMessage.content += content;
          }
        });
      },
    })),
  ),
);

export default useChatStore;
