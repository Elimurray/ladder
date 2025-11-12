import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://100.115.180.68:5000";

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
  getAll: () => api.get("/ladder"),
  getMyPosition: () => api.get("/ladder/me"),
  getUserPosition: (userId) => api.get(`/ladder/user/${userId}`),
  updateStatus: (status) => api.patch("/ladder/status", { status }),
  withdrawFromLadder: () => api.delete("/ladder/withdraw"),
  removeFromLadder: (userId) => api.delete(`/ladder/withdraw/${userId}`), // Add this line
  addToLadder: (user_id, position) =>
    api.post("/ladder/add", { user_id, position }),
  updatePosition: (id, position) => api.put(`/ladder/${id}`, { position }),
};

export const drawAPI = {
  getCurrentDraw: () => api.get("/draw/current"),
  getWeekDraw: (date) => api.get(`/draw/week/${date}`),
  generateDraw: (week_date) => api.post("/draw/generate", { week_date }),
  updatePairing: (id, data) => api.patch(`/draw/${id}`, data),
  deleteDraw: (date) => api.delete(`/draw/week/${date}`),
  deletePairing: (pairingId) => api.delete(`/draw/${pairingId}`),
  createPairing: (data) => api.post("/draw/pairing", data),
  publishDraw: (date) => api.patch(`/draw/week/${date}/publish`),
  unpublishDraw: (date) => api.patch(`/draw/week/${date}/unpublish`),
};

export const matchesAPI = {
  submitResult: (matchData) => api.post("/matches/submit", matchData),
  getMyResults: () => api.get("/matches/my-results"),
  getMyMatch: () => api.get("/matches/my-match"),
  getPending: () => api.get("/matches/pending"),
  getWeekResults: (date) => api.get(`/matches/week/${date}`),
  approveMatch: (matchId) => api.post(`/matches/approve-match/${matchId}`), // UPDATED
  approveAll: () => api.post("/matches/approve-all"),
  updateMatch: (matchId, data) => api.put(`/matches/match/${matchId}`, data), // UPDATED
  deleteMatch: (matchId) => api.delete(`/matches/match/${matchId}`), // UPDATED
  processWeek: (date) => api.post(`/matches/process-week/${date}`),
  getCurrentDraw: () => api.get("/draw/current"),
};

export const profileAPI = {
  getProfile: () => api.get("/profile/me"),
  getHistory: () => api.get("/profile/history"),
  getStats: () => api.get("/profile/stats"),
  updatePreferences: (preferences) =>
    api.put("/profile/preferences", preferences),
  updateStatus: (status) => api.patch("/profile/status", { status }),
  updateSquashLevels: (play_for_levels) =>
    api.patch("/profile/squash-levels", { play_for_levels }),
  getAllPreferences: () => api.get("/profile/all-preferences"),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  updateContact: (contactData) => api.put("/profile/contact", contactData),
};

export const resultsAPI = {
  getWeeks: () => api.get("/results/weeks"),
  getWeekResults: (date) => api.get(`/results/week/${date}`),
};

export default api;
