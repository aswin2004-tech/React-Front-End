// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://13.210.33.250/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("company_id");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (companyId) {
    config.headers["company-id"] = companyId; // ✅ FIX HERE
  }

  config.headers.Accept = "application/json";
  return config;
});

export default api;