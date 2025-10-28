import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.11:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API endpoints
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
};

export const usersAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
};

export const ladderAPI = {
  getPositions: () => api.get("/ladder"),
  updatePosition: (id, position) => api.put(`/ladder/${id}`, { position }),
};

export const matchesAPI = {
  submit: (matchData) => api.post("/matches", matchData),
  getWeekly: (date) => api.get(`/matches/week/${date}`),
};

export default api;
