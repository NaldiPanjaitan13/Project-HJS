import { CheckCircle } from "lucide-react";

export default function EmailVerified() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold">Email Berhasil Diverifikasi ✅</h1>
      <p className="text-gray-600 mt-2">
        Sekarang Anda dapat masuk ke akun Anda.
      </p>

      <a
        href="/login"
        className="mt-6 bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800"
      >
        Masuk
      </a>
    </div>
  );
}
