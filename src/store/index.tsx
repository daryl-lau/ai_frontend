import { create } from "zustand";

export const useIsAsideShown = create((set) => ({
  isAsideShown: true,
  setAsideShown: (payload: boolean) =>
    set(() => {
      return { isAsideShown: payload };
    }),
}));

export const useIsPending = create((set) => ({
  isPending: false,
  setIsPending: (payload: boolean) =>
    set(() => {
      return { isPending: payload };
    }),
}));

export const useIsStreaming = create((set) => ({
  isStreaming: false,
  setIsStreaming: (payload: boolean) =>
    set(() => {
      return { isStreaming: payload };
    }),
}));

export const useIsTyping = create((set) => ({
  isTyping: false,
  setIsTyping: (payload: boolean) =>
    set(() => {
      return { isTyping: payload };
    }),
}));

export const useUserStore = create((set) => ({
  userInfo: null,
  isInitializing: true,
  setUserInfo: (payload: { userInfo: any; isInitializing: boolean }) => {
    set(() => {
      return {
        userInfo: payload.userInfo,
        isInitializing: payload.isInitializing,
      };
    });
  },
}));
