// FrontEnd/src/api/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://attendance-app-vwy8.onrender.com"
});

// Firebase token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
