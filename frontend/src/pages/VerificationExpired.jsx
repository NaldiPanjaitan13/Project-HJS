import React, { useState } from "react";
import { resendVerification } from "../api/verify";

export default function VerificationExpired() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    try {
      await resendVerification(email);
      setMessage("Link verifikasi telah dikirim ulang! Cek email Anda.");
    } catch {
      setMessage("Gagal mengirim ulang link.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <h1 className="text-2xl font-bold text-red-600">Link Kadaluarsa ❌</h1>
      <p className="text-gray-600 mt-2">
        Masukkan email untuk mengirim ulang link verifikasi.
      </p>

      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded mt-4"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleResend}
        className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
      >
        Kirim ulang link
      </button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}
