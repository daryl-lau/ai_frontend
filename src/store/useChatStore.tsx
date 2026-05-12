import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt?: number;
}

interface ChatStore {
  sessions: Session[];
  messagesMap: Record<string, Message[]>;
  currentSessionId: string | null;
  loadingSessions: Record<string, boolean>;
  errors: Record<string, string | null>;

  // 会话操作
  addSession: (session: Session) => void;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  updateSessionTime: (sessionId: string) => void;

  // 消息操作
  addMessage: (sessionId: string, message: Message) => void;
  loadMessages: (sessionId: string, messages: Message[]) => void;
  clearSessionMessages: (sessionId: string) => void;
  appendToLastMessage: (sessionId: string, content: string) => void;

  // 状态管理
  setSessionLoading: (sessionId: string, loading: boolean) => void;
  setSessionError: (sessionId: string, error: string | null) => void;
}

const useChatStore = create<ChatStore>()(
  immer((set) => ({
    sessions: [],
    messagesMap: {},
    currentSessionId: null,
    loadingSessions: {},
    errors: {},

    // 会话操作
    addSession: (session) =>
      set((state) => {
        state.sessions.unshift(session);
        state.messagesMap[session.id] = [];
      }),

    deleteSession: (sessionId) =>
      set((state) => {
        const index = state.sessions.findIndex((s: any) => s.id === sessionId);
        if (index !== -1) {
          state.sessions.splice(index, 1);
        }
        delete state.messagesMap[sessionId];
        if (state.currentSessionId === sessionId) {
          state.currentSessionId = state.sessions[0]?.id || null;
        }
      }),

    setCurrentSession: (sessionId) =>
      set((state) => {
        state.currentSessionId = sessionId;
      }),

    updateSessionTitle: (sessionId, title) =>
      set((state) => {
        const session = state.sessions.find((s: any) => s.id === sessionId);
        if (session) {
          session.title = title;
          session.updatedAt = Date.now();
        }
      }),

    updateSessionTime: (sessionId) =>
      set((state) => {
        const session = state.sessions.find((s: any) => s.id === sessionId);
        if (session) {
          session.updatedAt = Date.now();
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

    loadMessages: (sessionId, messages) =>
      set((state) => {
        state.messagesMap[sessionId] = messages;
      }),

    clearSessionMessages: (sessionId) =>
      set((state) => {
        if (state.messagesMap[sessionId]) {
          state.messagesMap[sessionId] = [];
        }
      }),

    appendToLastMessage: (sessionId, content) =>
      set((state) => {
        const messages = state.messagesMap[sessionId];
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          lastMessage.content += content;
        }
      }),

    // 状态管理
    setSessionLoading: (sessionId, loading) =>
      set((state) => {
        state.loadingSessions[sessionId] = loading;
      }),

    setSessionError: (sessionId, error) =>
      set((state) => {
        state.errors[sessionId] = error;
      }),
  })),
);

export default useChatStore;
