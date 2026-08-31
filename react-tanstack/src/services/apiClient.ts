import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { tokenService } from "./tokenService";
import type { ApiEnvelope } from "../types";

const axiosInstance = axios.create({
  baseURL: "https://api.freeapi.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Attach the bearer token on every request that asks for it ----
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.requiresAuth) {
    const token = tokenService.getAccess();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});
// ---------------------------------------------------------------------

interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
}

// Tracks a refresh already in flight, so concurrent 401s share one call
// instead of each firing their own refresh-token request.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenService.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Plain axios.post, NOT axiosInstance — this must skip the interceptor
  // above entirely, otherwise a missing/expired access token on this very
  // call could trigger another refresh and loop forever.
  const res = await axios.post<ApiEnvelope<RefreshResponseData>>(
    "https://api.freeapi.app/api/v1/users/refresh-token",
    { refreshToken },
  );

  const { accessToken, refreshToken: newRefreshToken } = res.data.data;
  tokenService.set({ accessToken, refreshToken: newRefreshToken });
  return accessToken;
}

// ---- This is where the expired access token gets exchanged for a new one ----
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isUnauthorized = error.response?.status === 401;
    const canRetry = originalRequest && !originalRequest._retry;

    if (isUnauthorized && canRetry) {
      originalRequest._retry = true; // never retry the same request twice

      try {
        // If a refresh is already running, piggyback on it instead of
        // starting a second one.
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const newAccessToken = await refreshPromise;

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );
        return axiosInstance(originalRequest); // replay the original call
      } catch (refreshError) {
        tokenService.clear();
        // Let the caller's own catch/loader handle sending the user to /login
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message ?? error.message;
    return Promise.reject(new Error(message));
  },
);
// ------------------------------------------------------------------------------

export const apiClient = {
  get: async <T>(path: string, requiresAuth = false) => {
    const res = await axiosInstance.get<ApiEnvelope<T>>(path, { requiresAuth });
    return res.data;
  },
  post: async <T>(path: string, data?: unknown, requiresAuth = false) => {
    const res = await axiosInstance.post<ApiEnvelope<T>>(path, data, {
      requiresAuth,
    });
    return res.data;
  },
};
