import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import { getCurrentUser } from "../services/auth";

const DashboardUser = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Tetap redirect meskipun error
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard User</h1>
            <p className="text-gray-400 mt-2">Selamat datang, {user?.username}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Profile</h3>
            <p className="text-gray-400">Username: {user?.username}</p>
            <p className="text-gray-400">Email: {user?.email}</p>
            <p className="text-gray-400">Role: {user?.role}</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Status</h3>
            <p className="text-green-400">✓ Email Verified</p>
            <p className="text-green-400">✓ Account Active</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Quick Actions</h3>
            <button className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardUser;