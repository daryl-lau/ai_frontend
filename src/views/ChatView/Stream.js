// streamWorker.js
import Queue from "@/hooks/queue.ts";
import { APPEND_CHUNK_EVENT, IDLE_EVENT, SET_STREAM_STATUS_EVENT, TICK_EVENT, RESET_EVENT } from "@/constants/index.ts";

const stream = new Queue(1024);
let intervalId = null;
const intervalTimeout = 33;
const BATCH_SIZE = 1;
let streamingFlag = false;
let currentSessionId = null;

self.onmessage = (e) => {
  const { type, chunk, isStreaming, sessionId } = e.data;

  if (type === APPEND_CHUNK_EVENT) {
    // 1. 接收主线程传来的数据块，推入缓冲区
    stream.push(chunk);

    // 2. 如果定时器没启动，则启动它
    if (!intervalId) {
      intervalId = setInterval(() => {
        if (!stream.isEmpty()) {
          // 模拟 readBatch 逻辑：取出数据
          // 这里简单处理，每次取一个，你可以根据需要调整
          const chunkToSend = stream.shift(BATCH_SIZE);

          // 发送回主线程
          self.postMessage({
            type: TICK_EVENT,
            chunks: chunkToSend,
            sessionId: currentSessionId,
          });
        } else {
          // 缓冲区空了，通知主线程“打字”结束
          if (!streamingFlag) {
            clearInterval(intervalId);
            intervalId = null;
            self.postMessage({ type: IDLE_EVENT });
          }
        }
      }, intervalTimeout); // 对应原代码的 30ms 间隔
    }
  } else if (type === SET_STREAM_STATUS_EVENT) {
    streamingFlag = isStreaming;
    currentSessionId = sessionId;
  } else if (type === RESET_EVENT) {
    // 可选：用于重置状态
    stream.clear();
    streamingFlag = false;
    currentSessionId = null;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
