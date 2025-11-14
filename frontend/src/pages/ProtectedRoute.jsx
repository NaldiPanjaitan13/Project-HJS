import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const emailVerified = localStorage.getItem("emailVerified");

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (emailVerified !== "true") {
    return <Navigate to="/email-verification-expired" replace />;
  }

  if (role) {
    const user = getCurrentUser();
    
    if (!user || user.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}