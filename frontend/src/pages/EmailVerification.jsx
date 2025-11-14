import React, { useState } from "react";
import { Mail, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resendVerification } from "../services/auth";

const EmailVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verifikasi Email Anda
          </h2>
          <p className="text-gray-400 text-sm">
            Akun Anda belum terverifikasi. Masukkan email untuk mengirim ulang
            link verifikasi.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 bg-slate-700 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Mengirim..." : "Kirim Ulang Verifikasi"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-400 hover:text-white transition"
          >
            ← Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;