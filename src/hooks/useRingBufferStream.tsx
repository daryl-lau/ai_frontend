import { useRef, useCallback } from "react";

type RingBufferChunk = string;

export const useRingBufferStream = (initialCapacity = 1024) => {
  // 确保初始容量是 2 的幂
  const capacityRef = useRef<number>(initialCapacity);
  const maskRef = useRef<number>(initialCapacity - 1);
  const bufferRef = useRef<RingBufferChunk[]>(new Array(initialCapacity));
  const headRef = useRef<number>(0); // 读
  const tailRef = useRef<number>(0); // 写

  // 动态扩容逻辑
  const resize = () => {
    const oldCapacity = capacityRef.current;
    const newCapacity = oldCapacity * 2; // 翻倍
    const newBuffer = new Array(newCapacity);

    let count = 0;
    let i = headRef.current;
    while (i !== tailRef.current) {
      newBuffer[count++] = bufferRef.current[i];
      i = (i + 1) & (oldCapacity - 1);
    }

    // 更新状态
    bufferRef.current = newBuffer;
    capacityRef.current = newCapacity;
    maskRef.current = newCapacity - 1;
    headRef.current = 0;
    tailRef.current = count; // 数据现在在 0 到 count 之间
  };

  const write = useCallback((chunk: RingBufferChunk) => {
    // 检查是否满
    if (((tailRef.current + 1) & maskRef.current) === headRef.current) {
      resize(); // 满了自动扩容
    }

    bufferRef.current[tailRef.current] = chunk;
    tailRef.current = (tailRef.current + 1) & maskRef.current;
  }, []);

  const readBatch = useCallback((size: number) => {
    let result = "";
    let count = 0;

    while (headRef.current !== tailRef.current && count < size) {
      result += bufferRef.current[headRef.current];
      headRef.current = (headRef.current + 1) & maskRef.current;
      count++;
    }
    return result;
  }, []);

  const isEmpty = () => headRef.current === tailRef.current;

  return { write, readBatch, isEmpty };
};

export default useRingBufferStream;
