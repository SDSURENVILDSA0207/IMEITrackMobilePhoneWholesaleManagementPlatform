import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

type ApiAuthBindings = {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
};

let configured = false;

export function configureApiClient(bindings: ApiAuthBindings) {
  if (configured) return;
  configured = true;

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = bindings.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url ?? "";
      const isAuthLogin = url.includes("/auth/login");

      if (status === 401 && !isAuthLogin) {
        bindings.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );
}

export default api;
