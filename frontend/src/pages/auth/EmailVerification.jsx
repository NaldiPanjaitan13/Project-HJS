import React, { useState } from "react";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { resendVerification } from "../../services/auth";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email harus diisi");
      return;
    }

    try {
      setLoading(true);
      const response = await resendVerification(email);
      setMessage(response.data.message || "Email verifikasi telah dikirim!");
      
      setTimeout(() => {
        setEmail("");
      }, 3000);
      
    } catch (err) {
      console.error("Resend error:", err);
      setError(
        err?.response?.data?.message || "Gagal mengirim email verifikasi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-50 p-4 rounded-full">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-12 h-12 text-blue-600" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifikasi Email
            </h2>
            <p className="text-gray-500 text-sm">
              Masukkan email Anda untuk mengirim ulang link verifikasi
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 font-medium">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleResend} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all disabled:opacity-70"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[52px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                "Kirim Ulang Verifikasi"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Sudah verifikasi?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Inventory System.
        </p>
      </div>
    </div>
  );
};

export default EmailVerification;