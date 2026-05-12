import {
  useRef,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";

type StreamMessage = { content: string } & Record<string, unknown>;

type ReaderFn = (size: number) => string;

type IsEmptyFn = () => boolean;

type SetMessagesFn<T extends StreamMessage> = Dispatch<SetStateAction<T[]>>;

const useSmartRAF = <T extends StreamMessage>(
  reader: ReaderFn,
  isEmpty: IsEmptyFn,
  setMessages: SetMessagesFn<T>,
) => {
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const INTERVAL = 33;
  const setMessagesRef = useRef<SetMessagesFn<T>>(setMessages);
  const readerRef = useRef<ReaderFn>(reader);
  const isEmptyRef = useRef<IsEmptyFn>(isEmpty);

  useEffect(() => {
    setMessagesRef.current = setMessages;
    readerRef.current = reader;
    isEmptyRef.current = isEmpty;
  }, [setMessages, reader, isEmpty]);

  const renderLoop = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    if (timestamp - lastTimeRef.current >= INTERVAL) {
      if (!isEmptyRef.current()) {
        const newChunks = readerRef.current(1);
        setMessagesRef.current((prevMessages: T[]) => {
          if (prevMessages.length === 0) return prevMessages;
          const lastMsg = prevMessages[prevMessages.length - 1];
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + newChunks, // 在旧内容的基础上追加新内容
          };
          return newMessages;
        });
        lastTimeRef.current = timestamp;

        // 继续循环（因为还有或可能有数据）
        rafIdRef.current = requestAnimationFrame(renderLoop);
      } else {
        // 队列为空，停止循环
        isRunningRef.current = false;
        rafIdRef.current = null;
        lastTimeRef.current = 0;
      }
    } else {
      // 继续循环等待
      rafIdRef.current = requestAnimationFrame(renderLoop);
    }
  }, []);

  const startLoop = useCallback(() => {
    if (!isRunningRef.current && !isEmptyRef.current()) {
      isRunningRef.current = true;
      lastTimeRef.current = performance.now();
      rafIdRef.current = requestAnimationFrame(renderLoop);
    }
  }, [renderLoop]);

  const stopLoop = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  return { startLoop, stopLoop, isRunning: isRunningRef.current };
};

export default useSmartRAF;
