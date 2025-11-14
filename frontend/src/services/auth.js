import api from "./api"; 

export const register = (data) => api.post("/register", data);
export const login = (data) => api.post("/login", data);
export const verifyEmail = (token) => api.get(`/verify-email/${token}`);
export const resendVerification = (email) => api.post("/email/resend", { email });
export const logout = async () => {
  try {
    await api.post("/logout");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("emailVerified");
    
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("emailVerified");
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }
  return null;
};