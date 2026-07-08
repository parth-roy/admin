import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStorage } from "@/lib/auth";

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api/v1"
  : "https://api.gomytruck.com/api/v1";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

// Singleton Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Track if a refresh is in progress to prevent parallel refresh calls
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

// ── Request interceptor: inject Authorization header ─────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: on 401 → refresh → retry ──────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401 errors that haven't already been retried
    // and are NOT the login/refresh/forgot/reset endpoints themselves
    const isAuthEndpoint = originalRequest?.url?.includes("/admin/auth/");
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request — wait for current refresh to complete
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = authStorage.getRefreshToken();

      if (!refreshToken) {
        authStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        authStorage.setTokens(accessToken, newRefreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        authStorage.clearTokens();
        pendingRequests = [];
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
