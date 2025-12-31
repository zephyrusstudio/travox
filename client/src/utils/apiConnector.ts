// src/lib/http.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { errorToast } from "./toasts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";
const USER_KEY = import.meta.env.VITE_USER_KEY || "travox-ua";

// Session expired event for modal
export const SESSION_EXPIRED_EVENT = "session-expired";

export const dispatchSessionExpired = () => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};

// Logout utility function
// Note: For cross-domain setups, cookies are cleared server-side via /auth/logout
// The travox-at cookie is httpOnly and set by a different domain, so we can't clear it from JS
export const handleLogout = () => {
  localStorage?.removeItem(TOKEN_KEY);
  sessionStorage?.removeItem(TOKEN_KEY);
  localStorage?.removeItem(USER_KEY);
  sessionStorage?.removeItem(USER_KEY);
  
  // Dispatch session expired event to show modal
  dispatchSessionExpired();
};

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important: sends cookies with cross-origin requests
});

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
    // Check for authentication errors (401 Unauthorized or 403 Forbidden)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Dispatch session expired event to show modal
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
