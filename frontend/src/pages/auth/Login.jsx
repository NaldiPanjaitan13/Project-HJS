import { ArrowLeft, Eye, EyeOff, Mail, Lock, Loader } from "lucide-react";
import React, { useState } from "react";
import { login } from "../../services/auth";
import { Link, useNavigate } from "react-router-dom"; 


function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!email || !password) {
    setError("Email dan password harus diisi");
    return;
  }

  try {
    setLoading(true);

    const res = await login({ email, password });
    
    console.log("✅ Login response:", res.data);
    
    const { token, user } = res.data;

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("accessToken", token); 
    storage.setItem("user", JSON.stringify(user));
    
    const isVerified = user.email_verified_at ? "true" : "false";
    storage.setItem("emailVerified", isVerified);
    
    console.log("📧 Email verified status:", isVerified);

    if (!user.email_verified_at) {
      setError("Akun belum terverifikasi. Silakan cek email Anda untuk verifikasi.");
      
      storage.removeItem("accessToken");
      storage.removeItem("user");
      storage.removeItem("emailVerified");
      
      return;
    }

    const userRole = user.role || 'user'; 
    
    console.log("👤 User role:", userRole);

    setSuccess("Login berhasil! Mengalihkan...");
    
    setTimeout(() => {
      if (userRole === 'admin') {
        console.log("🔀 Redirecting to admin dashboard");
        navigate("/dashboard-admin");  
      } else {
        console.log("🔀 Redirecting to user dashboard");
        navigate("/dashboard-user");    
      }
    }, 800);

  } catch (err) {
    console.error("❌ Login error:", err);
    
    let errorMessage = "Email atau password salah.";
    
    if (err?.response?.data?.message) {
      errorMessage = err.response.data.message;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/register" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Belum punya akun? Daftar
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Masuk ke Akun
            </h2>
            <p className="text-gray-600 text-sm">
              Masukkan kredensial Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  disabled={loading}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Ingat saya</span>
              </label>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Lupa password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 focus:ring-2 transition duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sedang masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;