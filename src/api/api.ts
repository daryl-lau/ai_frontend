import axios from "axios";
import type { Method, AxiosResponse, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { ACCESS_TOKEN_KEY, REDIRECT_TO_LOGIN_EVENT } from "@/constants";

// 自定义事件：触发登录重定向
function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.dispatchEvent(
      new CustomEvent(REDIRECT_TO_LOGIN_EVENT, {
        detail: { returnPath: window.location.pathname },
      }),
    );
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() ?? "",
  withCredentials: true,
});

let isRefreshing = false;
// 为请求队列中的每个 Promise 补充 resolve 和 reject 的泛型类型
interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// 请求拦截器：使用 InternalAxiosRequestConfig 确保 headers 等属性的类型安全
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：明确标注 response 和 error 的类型
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const originalRequest = error?.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (originalRequest.url?.includes('/logout')) {
      return Promise.reject(error);
    }

    // 防止刷新请求本身被再次拦截，防止无限循环
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    const isUnauthorized = error?.response?.status === 401;

    if (isUnauthorized && originalRequest && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return api
        .post("/auth/refresh")
        .then(({ data }) => {
          const payload = data?.data ?? data;
          const accessToken = payload?.access_token;
          if (accessToken) {
            api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            originalRequest.headers!.Authorization = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            return api(originalRequest);
          }
          throw new Error(payload?.msg || payload?.detail || "Refresh failed");
        })
        .catch((err) => {
          processQueue(err, null);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          redirectToLogin();
          return Promise.reject(err);
        });
    }

    return Promise.reject(error);
  },
);

// 定义 createApi 返回的各个 HTTP 方法的函数类型
type HttpMethod = <T = any>(data?: any, config?: AxiosRequestConfig) => Promise<T>;

// 定义 createApi 返回的对象类型
interface ApiMethods {
  get: (url: string) => HttpMethod;
  post: (url: string) => HttpMethod;
  put: (url: string) => HttpMethod;
  delete: (url: string) => HttpMethod;
  patch: (url: string) => HttpMethod;
  head: (url: string) => HttpMethod;
  options: (url: string) => HttpMethod;
  request: <T = any>(method: Method, url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
}

/**
 * @param {string} baseUrl - 基础路径（如 '/auth'、'/user'）
 * @returns {Object} 包含所有 HTTP 方法的对象
 */
export const createApi = (baseUrl: string = ""): ApiMethods => {
  const request = async <T = any>(
    method: Method,
    url: string,
    data = null,
    config: AxiosRequestConfig = {},
  ): Promise<T> => {
    const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
    const methodLower = method.toLowerCase();

    let response: AxiosResponse<T>;
    switch (method) {
      case "get":
      case "delete":
      case "head":
      case "options":
        // 这些方法使用 params（查询参数）
        response = await api[methodLower as "get" | "delete" | "head" | "options"](fullUrl, {
          params: data, // data 作为查询参数
          ...config,
        });
        break;

      case "post":
      case "put":
      case "patch":
        // 这些方法使用 data（请求体）
        response = await api[methodLower as "post" | "put" | "patch"](fullUrl, data, config);
        break;

      default:
        response = await api.request({
          method,
          url: fullUrl,
          data,
          ...config,
        });
    }

    return response?.data;
  };

  return {
    get:
      (url: string) =>
      <T = any>(params?: any, config?: AxiosRequestConfig) =>
        request<T>("get", url, params, config),
    post:
      (url: string) =>
      <T = any>(data?: any, config?: AxiosRequestConfig) =>
        request<T>("post", url, data, config),
    put:
      (url: string) =>
      <T = any>(data?: any, config?: AxiosRequestConfig) =>
        request<T>("put", url, data, config),
    delete:
      (url: string) =>
      <T = any>(params?: any, config?: AxiosRequestConfig) =>
        request<T>("delete", url, params, config),
    patch:
      (url: string) =>
      <T = any>(data?: any, config?: AxiosRequestConfig) =>
        request<T>("patch", url, data, config),
    head:
      (url: string) =>
      <T = any>(params?: any, config?: AxiosRequestConfig) =>
        request<T>("head", url, params, config),
    options:
      (url: string) =>
      <T = any>(params?: any, config?: AxiosRequestConfig) =>
        request<T>("options", url, params, config),
    request: <T = any>(method: Method, url: string, data = null, config: AxiosRequestConfig = {}) =>
      request<T>(method, url, data, config),
  };
};
