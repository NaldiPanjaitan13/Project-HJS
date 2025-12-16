import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const VerifyEmailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('Memverifikasi email Anda...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get all query params (expires, signature, hash)
        const expires = searchParams.get('expires');
        const signature = searchParams.get('signature');
        const hash = searchParams.get('hash');

        if (!expires || !signature || !hash) {
          setStatus('error');
          setMessage('Link verifikasi tidak valid atau tidak lengkap.');
          return;
        }

        // Call verification endpoint
        const response = await api.get(`/email/verify/${id}/${hash}`, {
          params: { expires, signature }
        });

        if (response.data.status === 'success') {
          setStatus('success');
          setMessage(response.data.message || 'Email berhasil diverifikasi!');
          
          // Start countdown
          const interval = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                navigate('/login');
              }
              return prev - 1;
            });
          }, 1000);
        }

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        
        if (error.response?.data?.message) {
          setMessage(error.response.data.message);
        } else {
          setMessage('Terjadi kesalahan saat verifikasi email.');
        }
      }
    };

    verifyEmail();
  }, [id, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <div className="bg-blue-50 p-4 rounded-full">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="bg-green-50 p-4 rounded-full animate-scale-in">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 p-4 rounded-full">
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {status === 'verifying' && 'Memverifikasi Email...'}
            {status === 'success' && 'Verifikasi Berhasil!'}
            {status === 'error' && 'Verifikasi Gagal'}
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            {message}
          </p>

          {/* Countdown or Action Button */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                <span>Mengalihkan ke login dalam</span>
                <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                  {countdown}
                </span>
              </div>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Login Sekarang
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all"
            >
              Kembali ke Login
            </button>
          )}

          {status === 'verifying' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Inventory System.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;