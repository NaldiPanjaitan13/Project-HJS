import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const userString = localStorage.getItem("user") || sessionStorage.getItem("user");
  const emailVerified = (localStorage.getItem("emailVerified") || sessionStorage.getItem("emailVerified")) === "true";

  if (!token) {
    console.log("❌ No token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error("❌ Gagal parse data user:", e);
      localStorage.clear();
      sessionStorage.clear();
      return <Navigate to="/login" replace />;
    }
  } else {
    console.log("❌ No user data found");
    return <Navigate to="/login" replace />;
  }

  if (!emailVerified && !user.email_verified_at) {
    console.log("❌ Email not verified");
    return <Navigate to="/email-verification-expired" replace />;
  }
  if (role) {
    const userRole = user.role || "user";
    
    if (userRole !== role) {
      console.log(`❌ Role mismatch: expected ${role}, got ${userRole}`);
      
      
      if (userRole === "admin") {
        return <Navigate to="/dashboard-admin" replace />;
      } else {
        return <Navigate to="/dashboard-user" replace />;
      }
    }
  }

  console.log("✅ Access granted");
  return children;
};

export default ProtectedRoute;