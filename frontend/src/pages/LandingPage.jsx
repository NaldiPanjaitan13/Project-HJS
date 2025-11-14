import React, { useState } from "react";
import { Menu, X, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-400" />
              <span className="ml-2 text-xl font-bold text-white">SecureApp</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-white hover:text-purple-400 transition"
              >
                Masuk
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Daftar
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-purple-500/20">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-white hover:bg-slate-700 rounded"
              >
                Masuk
              </button>
              <button
                onClick={() => {
                  navigate("/register");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Daftar
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Selamat Datang di
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              SecureApp
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Platform modern dengan keamanan tinggi dan pengalaman pengguna yang luar biasa
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-4 bg-purple-600 text-white text-lg rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
          >
            Mulai Sekarang
          </button>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <Shield className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Keamanan Terjamin</h3>
            <p className="text-gray-400">
              Sistem autentikasi yang aman dengan enkripsi tingkat tinggi
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <Zap className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Performa Cepat</h3>
            <p className="text-gray-400">
              Interface yang responsif dan loading yang sangat cepat
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <Users className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Multi-User</h3>
            <p className="text-gray-400">
              Mendukung berbagai role pengguna dengan dashboard khusus
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-purple-500/20 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2025 SecureApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;