// src/lib/http.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { errorToast } from "./toasts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";
const USER_KEY = import.meta.env.VITE_USER_KEY || "travox-ua";
const REFRESH_ENDPOINT = "/auth/refresh";

// Session expired event for modal
export const SESSION_EXPIRED_EVENT = "session-expired";

export const dispatchSessionExpired = () => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

const persistAccessToken = (token: string) => {
  localStorage?.setItem(TOKEN_KEY, token);
  sessionStorage?.setItem(TOKEN_KEY, token);
};

const clearStoredAuth = () => {
  localStorage?.removeItem(TOKEN_KEY);
  sessionStorage?.removeItem(TOKEN_KEY);
  localStorage?.removeItem(USER_KEY);
  sessionStorage?.removeItem(USER_KEY);
};

// Logout utility function
// Note: For cross-domain setups, cookies are cleared server-side via /auth/logout
// The travox-at cookie is httpOnly and set by a different domain, so we can't clear it from JS
export const handleLogout = () => {
  clearStoredAuth();

  // Dispatch session expired event to show modal
  dispatchSessionExpired();
};

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important: sends cookies with cross-origin requests
});

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post(REFRESH_ENDPOINT)
      .then((response) => {
        const accessToken = response.data?.data?.accessToken;
        if (typeof accessToken === "string" && accessToken.length > 0) {
          persistAccessToken(accessToken);
          return accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Attach bearer token from localStorage/sessionStorage
// Note: The server also accepts the token from the travox-at cookie (sent automatically by browser)
// but we include Authorization header as well for compatibility
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;

    // Check for authentication errors (401 Unauthorized or 403 Forbidden)
    if (
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      requestConfig.url !== REFRESH_ENDPOINT
    ) {
      requestConfig._retry = true;

      return refreshAccessToken().then((newToken) => {
        if (!newToken) {
          handleLogout();
          return Promise.reject(error);
        }

        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${newToken}`;
        return api(requestConfig);
      });
    }

    if (error.response?.status === 401 && requestConfig?.url === REFRESH_ENDPOINT) {
      handleLogout();
    }

    return Promise.reject(error);
  }
);

export class ApiError extends Error {
  status?: number;
  code?: string;
  data?: any;
  constructor(
    message: string,
    init?: { status?: number; code?: string; data?: any }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = init?.status;
    this.code = init?.code;
    this.data = init?.data;
  }
}

export function parseApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status;
    // common backend shapes:
    // { status:"error", data: { message: "...", ... } }
    // { message:"..." }
    const msg =
      ax.response?.data?.data?.message ||
      ax.response?.data?.message ||
      ax.message ||
      "Request failed";
    return new ApiError(msg, {
      status,
      code: ax.code,
      data: ax.response?.data,
    });
  }
  if (err instanceof Error) return new ApiError(err.message);
  return new ApiError("Unknown error");
}

/** Generic request. Pass any Axios config. Returns response data. Throws ApiError on failure. */
export async function apiRequest<T = any>(cfg: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api.request<T>(cfg);
    return res.data;
  } catch (error: any) {
    const parsedError = parseApiError(error);
    console.log(parsedError.message);
    errorToast(parsedError.message);
    throw parsedError;
  }
}
