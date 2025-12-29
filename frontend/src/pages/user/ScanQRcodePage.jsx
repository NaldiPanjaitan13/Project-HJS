import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Package,
  Barcode,
  Search,
  X,
  Clock,
  User,
  TrendingUp,
  Upload,
  Video,
  VideoOff
} from 'lucide-react';
import { productapi } from '../../services/productapi';
import QrScanner from 'qr-scanner';

const QRScannerUser = () => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({
    todayScans: 0,
    totalScans: 0,
    uniqueProducts: 0
  });
  
  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    loadScanHistory();
    loadStats();
    
    return () => {
      stopCamera();
    };
  }, []);

  const loadScanHistory = () => {
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    setScanHistory(history.slice(0, 10));
  };

  const loadStats = () => {
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    const today = new Date().toDateString();
    const todayScans = history.filter(h => new Date(h.scannedAt).toDateString() === today).length;
    const uniqueProducts = new Set(history.map(h => h.productId)).size;

    setStats({
      todayScans,
      totalScans: history.length,
      uniqueProducts
    });
  };

  const saveScanToHistory = (product) => {
    const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    const newScan = {
      productId: product.product_id,
      productName: product.nama_barang,
      kodeBarang: product.kode_barang,
      scannedAt: new Date().toISOString(),
      scannedBy: user.name || user.email
    };
    
    history.unshift(newScan);
    localStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)));
    loadScanHistory();
    loadStats();
  };

  const searchProduct = async (code) => {
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    const response = await productapi.scanQr({ qr_code: code });
    
    // Cek response structure
    if (response?.data?.success && response?.data?.data) {
      const product = response.data.data;
      setScannedProduct(product);
      saveScanToHistory(product);
      setSuccess(`✓ Produk ditemukan: ${product.nama_barang}`);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      return true;
    } else {
      setError('Produk tidak ditemukan!');
      return false;
    }
  } catch (err) {
    console.error('Search product error:', err);
    
    // Handle different error types
    if (err.response?.status === 404) {
      setError('QR Code tidak ditemukan di database!');
    } else if (err.response?.status === 401) {
      setError('Sesi Anda telah berakhir. Silakan login kembali.');
    } else if (err.response?.status === 422) {
      setError('Format QR Code tidak valid!');
    } else {
      setError(err.response?.data?.message || 'Gagal memindai QR Code. Silakan coba lagi.');
    }
    
    return false;
  } finally {
    setLoading(false);
    }
  };

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      setError('Masukkan kode QR atau barcode!');
      return;
    }

    await searchProduct(manualCode.trim());
    setManualCode('');
  };

  // Start Camera Scanner
  const startCamera = async () => {
    try {
      setError('');
      setCameraActive(true);
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        qrScannerRef.current = new QrScanner(
          videoRef.current,
          async (result) => {
            if (result?.data && !loading) {
              setScanning(false);
              const success = await searchProduct(result.data);
              if (success) {
                stopCamera();
              } else {
                setTimeout(() => setScanning(true), 2000);
              }
            }
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        qrScannerRef.current.start();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
      setCameraActive(false);
      setScanning(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setScanning(false);
  };

  // Handle Image Upload
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });

      if (result?.data) {
        await searchProduct(result.data);
      } else {
        setError('Tidak dapat menemukan QR Code di gambar!');
      }
    } catch (err) {
      console.error('Image scan error:', err);
      setError('Gagal membaca QR Code dari gambar. Pastikan gambar jelas dan mengandung QR Code.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearProduct = () => {
    setScannedProduct(null);
    setSuccess('');
    setError('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <QrCode className="w-8 h-8" />
              QR Code Scanner
            </h2>
            <p className="text-purple-100">Scan QR Code atau Barcode untuk melihat detail produk</p>
          </div>
          <Camera className="w-20 h-20 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.todayScans}</h3>
          <p className="text-sm text-gray-500 font-medium">Scan Hari Ini</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalScans}</h3>
          <p className="text-sm text-gray-500 font-medium">Total Scan</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.uniqueProducts}</h3>
          <p className="text-sm text-gray-500 font-medium">Produk Unik</p>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-center gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Scanner Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Camera Scanner Button */}
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all ${
            cameraActive
              ? 'bg-red-50 border-red-300 hover:bg-red-100'
              : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
          }`}
        >
          {cameraActive ? (
            <>
              <VideoOff className="w-8 h-8 text-red-600" />
              <div className="text-center">
                <p className="font-bold text-red-900">Stop Kamera</p>
                <p className="text-xs text-red-600 mt-1">Kamera sedang aktif</p>
              </div>
            </>
          ) : (
            <>
              <Video className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <p className="font-bold text-blue-900">Buka Kamera</p>
                <p className="text-xs text-blue-600 mt-1">Scan dengan kamera</p>
              </div>
            </>
          )}
        </button>

        {/* Upload Image Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 border-2 border-purple-300 rounded-xl hover:bg-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-8 h-8 text-purple-600" />
          <div className="text-center">
            <p className="font-bold text-purple-900">Upload Gambar</p>
            <p className="text-xs text-purple-600 mt-1">Pilih dari galeri</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </button>

        {/* Manual Input Preview */}
        <div className="flex flex-col items-center justify-center gap-3 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
          <Barcode className="w-8 h-8 text-green-600" />
          <div className="text-center">
            <p className="font-bold text-green-900">Input Manual</p>
            <p className="text-xs text-green-600 mt-1">Ketik kode di bawah</p>
          </div>
        </div>
      </div>

      {/* Camera Preview */}
      {cameraActive && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-300 overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5" />
              <span className="font-bold">Kamera Aktif</span>
            </div>
            {scanning && (
              <div className="flex items-center gap-2">
                <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">Scanning...</span>
              </div>
            )}
          </div>
          <div className="relative bg-black">
            <video
              ref={videoRef}
              className="w-full h-96 object-cover"
              playsInline
            />
            <div className="absolute inset-0 border-4 border-blue-400 opacity-50 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white opacity-70"></div>
            </div>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              📷 Arahkan kamera ke QR Code atau Barcode
            </p>
          </div>
        </div>
      )}

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manual Input Scanner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Barcode className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Input Manual</h3>
              <p className="text-sm text-gray-500">Masukkan kode QR atau barcode</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kode QR / Barcode
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  placeholder="Masukkan kode QR atau scan barcode..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={handleManualScan}
              disabled={loading || !manualCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Scan Sekarang</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700 font-medium mb-2">💡 Tips:</p>
            <ul className="text-xs text-purple-600 space-y-1">
              <li>• Gunakan kamera untuk scan otomatis</li>
              <li>• Upload gambar QR Code dari galeri</li>
              <li>• Atau ketik kode secara manual</li>
              <li>• Tekan Enter setelah memasukkan kode</li>
            </ul>
          </div>
        </div>

        {/* Product Detail Result */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detail Produk</h3>
                <p className="text-sm text-gray-500">Hasil scan akan muncul di sini</p>
              </div>
            </div>
            {scannedProduct && (
              <button
                onClick={handleClearProduct}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                title="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {!scannedProduct ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <QrCode className="w-24 h-24 mb-4 opacity-20" />
              <p className="text-sm font-medium">Belum ada produk yang di-scan</p>
              <p className="text-xs mt-1">Scan QR code untuk melihat detail</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Produk Ditemukan!</span>
                </div>
                <h4 className="text-xl font-bold text-green-900 mb-1">
                  {scannedProduct.nama_barang}
                </h4>
                <p className="text-sm text-green-700">
                  Kode: {scannedProduct.kode_barang}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Jenis Barang</p>
                  <p className="font-semibold text-gray-900">
                    {scannedProduct.jenis_barang || '-'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Satuan</p>
                  <p className="font-semibold text-gray-900">
                    {scannedProduct.satuan || '-'}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Stok Tersedia</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {scannedProduct.stok || 0}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 mb-1">Harga Jual</p>
                  <p className="text-lg font-bold text-purple-700">
                    Rp {(scannedProduct.harga_jual || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {scannedProduct.deskripsi && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Deskripsi</p>
                  <p className="text-sm text-gray-700">{scannedProduct.deskripsi}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scan History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Riwayat Scan</h3>
              <p className="text-sm text-gray-500">10 scan terakhir Anda</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {scanHistory.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Belum ada riwayat scan</p>
              <p className="text-sm mt-1">Scan akan muncul di sini</p>
            </div>
          ) : (
            scanHistory.map((history, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{history.productName}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          {history.kodeBarang}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {history.scannedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(history.scannedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerUser;