import React, { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; 
import { register } from "../../services/auth";

const PasswordInputWithValidation = React.memo(({
  id,
  label,
  value,
  onChange,
  disabled,
  show,
  toggleShow,
  isValid,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full pl-10 ${
          isValid ? "pr-20" : "pr-12"
        } py-3 border rounded-lg focus:ring-2 transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
          isValid
            ? "border-green-400 focus:ring-green-500"
            : value.length > 0
            ? "border-red-400 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        }`}
        placeholder={
          id === "password" ? "Minimal 8 karakter" : "Ulangi password"
        }
      />
      <div className="absolute inset-y-0 right-0 flex items-center">
        {isValid && (
          <div className="pr-2 flex items-center pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
        <button
          type="button"
          onClick={toggleShow}
          disabled={disabled}
          className="pr-3 flex items-center disabled:cursor-not-allowed hover:opacity-70 transition"
        >
          {show ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  </div>
));

const Register = () => { 
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(0);

  const [formData, setFormData] = useState({
    username: "", 
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  }, [error]);

  const isUsernameValid = useMemo(() => formData.username.trim().length >= 3, [formData.username]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()), [formData.email]);
  const isPasswordValid = useMemo(() => {
    const pwd = formData.password;
    return pwd.length >= 8 && 
           /[a-z]/.test(pwd) && 
           /[A-Z]/.test(pwd) && 
           /[0-9]/.test(pwd);
  }, [formData.password]);
  
  const isConfirmPasswordValid = useMemo(() => 
    formData.password.length >= 8 && 
    formData.password === formData.confirmPassword,
    [formData.password, formData.confirmPassword]
  );

  const validateForm = () => {
    if (!isUsernameValid) {
      setError("Username wajib diisi dan minimal 3 karakter.");
      return false;
    }
    if (!isEmailValid) {
      setError("Format email tidak valid.");
      return false;
    }
    if (!isPasswordValid) {
      setError("Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, dan angka.");
      return false;
    }
    if (!isConfirmPasswordValid) {
      setError("Password dan konfirmasi password tidak sama.");
      return false;
    }
    if (!formData.terms) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        username: formData.username.trim(), 
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.confirmPassword, 
      };

      const response = await register(registerData);

      console.log("Respon sukses:", response.data);
      
      setSuccess(true);
      setSuccessCountdown(3); 
      setFormData({ 
        username: "", 
        email: "", 
        password: "", 
        confirmPassword: "", 
        terms: false 
      });

      const interval = setInterval(() => {
        setSuccessCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate('/login');
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Error registrasi:", err);
      
      let apiErrorMessage = "Registrasi gagal. Silakan coba lagi.";
      
      if (err.response) {
        console.error("Data Error:", err.response.data);
        
        if (err.response.data?.errors) {
          const errors = err.response.data.errors;
          apiErrorMessage = Object.values(errors).flat().join("; ");
        } else if (err.response.data?.message) {
          apiErrorMessage = err.response.data.message;
        }
      } else if (err.request) {
        console.error("Request Error:", err.request);
        apiErrorMessage = "Tidak dapat terhubung ke server. Pastikan server Laravel berjalan.";
      } else {
        console.error("Error:", err.message);
        apiErrorMessage = err.message;
      }
      
      setError(apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Modal Sukses */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                <div className="relative flex items-center justify-center h-24">
                  <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Registrasi Berhasil!
            </h3>
            <p className="text-gray-600 mb-6">
              Akun Anda telah berhasil dibuat. Silakan cek email untuk verifikasi. Mengalihkan ke halaman login...
            </p>
            {successCountdown > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-gray-700">
                    Mengalihkan dalam
                  </p>
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold text-lg">
                    {successCountdown}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Lanjut ke Login
            </button>
          </div>
        </div>
      )}

      {/* Konten Utama */}
      <div className="max-w-md w-full space-y-8">
        <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-900 transition mb-4">
          <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Login
        </Link>
        
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Daftar Akun Baru
            </h2>
            <p className="text-gray-600">
              Isi data Anda untuk membuat akun.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Minimal 3 karakter"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    isUsernameValid
                      ? "border-green-400 focus:ring-green-500"
                      : formData.username.length > 0
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {isUsernameValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {formData.username.length > 0 && !isUsernameValid && (
                <p className="text-xs text-red-500 mt-1">
                  Username harus minimal 3 karakter
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="nama@email.com"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    isEmailValid
                      ? "border-green-400 focus:ring-green-500"
                      : formData.email.length > 0
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {isEmailValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {formData.email.length > 0 && !isEmailValid && (
                <p className="text-xs text-red-500 mt-1">
                  Format email tidak valid.
                </p>
              )}
            </div>

            {/* Password */}
            <PasswordInputWithValidation
              id="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              show={showPassword}
              toggleShow={() => setShowPassword(!showPassword)}
              isValid={isPasswordValid}
            />
            {formData.password.length > 0 && !isPasswordValid && (
              <p className="text-xs text-red-500 -mt-4">
                Password minimal 8 karakter (huruf besar, kecil, dan angka)
              </p>
            )}

            {/* Konfirmasi Password */}
            <PasswordInputWithValidation
              id="confirmPassword"
              label="Konfirmasi Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              show={showConfirmPassword}
              toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              isValid={isConfirmPasswordValid}
            />

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                Saya menyetujui{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Syarat & Ketentuan
                </a>
                <span className="text-red-500"> *</span>
              </label>
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-center text-gray-600 mb-4">
                Sudah punya akun? 
                <Link 
                  to="/login"
                  className="text-blue-600 font-semibold hover:underline ml-1"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading || !formData.terms}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mendaftar...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;