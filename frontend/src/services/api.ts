import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("filmly_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend devuelve 401, limpiamos sesión
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("filmly_token");
      localStorage.removeItem("filmly_email");
    }
    return Promise.reject(error);
  }
);
