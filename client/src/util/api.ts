import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { HistoryResponse, PredictionResultProps } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
let accessToken: string | null = null;
const isBrowser = typeof window !== "undefined";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // console.log("token expired, refreshing silently...");
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        accessToken = data.access_token;
        // console.log("refresh successful, retrying original request...");

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("refresh failed:", refreshError);
        processQueue(refreshError as AxiosError, null);
        accessToken = null;

        if (isBrowser) {
          localStorage.removeItem("dw_auth");
          window.dispatchEvent(new Event("auth:session_expired"));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  getAccessToken: () => accessToken,
  clearAuth: () => {
    accessToken = null;
    if (isBrowser) {
      localStorage.removeItem("dw_auth");
    }
  },

  refreshToken: async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      accessToken = data.access_token;
      return true;
    } catch (error) {
      accessToken = null;
      if (isBrowser) {
        localStorage.removeItem("dw_auth");
      }
      return false;
    }
  },

  predict: (
    clinical: any,
    lifestyle: any,
    note: string
  ): Promise<PredictionResultProps> =>
    apiClient.post("/predict", {
      clinical_features: clinical,
      lifestyle_features: lifestyle,
      health_note: note,
    }),

  getHistory: (cursor?: string): Promise<HistoryResponse> =>
    apiClient.get("/users/screenings/history", {
      params: { cursor, limit: 50 },
    }) as unknown as Promise<HistoryResponse>,

  submitFeedback: (predictionId: string, actualClass: number) =>
    apiClient.post("/feedback", {
      prediction_id: predictionId,
      actual_class: actualClass,
    }),

  register: async (
    email: string,
    password: string,
    linkGuest: boolean = false
  ) => {
    const response = await axios.post(
      `${API_BASE}/auth/register`,
      {
        email,
        password,
        link_guest: linkGuest,
      },
      { withCredentials: true }
    );

    if (response.data.access_token) {
      accessToken = response.data.access_token;
    }
    if (isBrowser) {
      localStorage.setItem("dw_auth", "1");
    }
    return response.data;
  },

  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await axios.post(
      `${API_BASE}/auth/login`,
      formData.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      }
    );

    accessToken = response.data.access_token;
    if (isBrowser) {
      localStorage.setItem("dw_auth", "1");
    }
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      accessToken = null;
      if (isBrowser) {
        localStorage.removeItem("dw_auth");
      }
    }
  },

  declineVerification: async (predictionId: string) => {
    await apiClient.post(`/predictions/${predictionId}/decline-verification`);
  },

  

  getHealth: async () => {
    const response = await axios.get(`${API_BASE}/health`);
    return response.data;
  },
};
