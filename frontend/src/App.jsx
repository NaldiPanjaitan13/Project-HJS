import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages//auth/Login";
import DashboardAdmin from "./pages/DashboardAdmin";
import Register from "./pages/auth/Register";
import DashboardUser from "./pages/DashboardUser";
import LandingPage from "./pages/LandingPage";
import EmailVerificationExpired from "./pages/EmailVerification";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email-verification-expired" element={<EmailVerificationExpired />} />
        
        {/* Protected route untuk admin */}
        <Route 
          path="/dashboard-admin" 
          element={
            <ProtectedRoute role="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected route untuk user */}
        <Route 
          path="/dashboard-user" 
          element={
            <ProtectedRoute role="user">
              <DashboardUser />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;