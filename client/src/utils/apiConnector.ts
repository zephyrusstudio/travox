// src/lib/http.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { errorToast } from "./toasts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const TOKEN_KEY = "token";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// attach bearer automatically
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    console.log(error.response?.data?.data?.message);
    errorToast(error.response?.data?.data?.message);

    return error?.response;
  }
}
