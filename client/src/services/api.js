// client/src/services/api.js
import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // <--- THIS IS REQUIRED FOR COOKIES TO WORK
  headers: {
    "Content-Type": "application/json",
  },
});