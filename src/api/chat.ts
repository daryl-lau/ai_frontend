import { api, createApi } from "./api";
import type { AxiosRequestConfig } from "axios";

const chatBaseUri = "/chat";
export const chatApi = {
  get_sessions: createApi(chatBaseUri).get("/sessions"),
  get_messages: createApi(chatBaseUri).get("/history_messages"),
};

interface SSEAxiosRequestConfig extends AxiosRequestConfig {
  onChunk?: (chunk: string) => void;
}

export async function apiSseRequest(
  path: string,
  options: SSEAxiosRequestConfig = {},
) {
  let lastIndex = 0;
  const response = await api.request({
    url: path,
    method: "POST",
    headers: {
      Accept: "text/event-stream",
    },
    data: options.data,
    signal: options.signal,
    responseType: "text",
    onDownloadProgress: (event) => {
      const fullText = event?.event?.target?.responseText ?? "";
      if (!fullText || fullText.length <= lastIndex) return;
      const chunk = fullText.slice(lastIndex);
      lastIndex = fullText.length;
      options.onChunk?.(chunk);
    },
  });

  return response;
}
