import React, { useState, useEffect } from 'react';
import { 
  Package, PackagePlus, PackageMinus, QrCode, 
  TrendingUp, TrendingDown, AlertCircle, Calendar, Clock
} from 'lucide-react';
import { stockapi } from '../../services/stockapi';

const DashboardUserPage = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalMasuk: 0,
    totalKeluar: 0,
    transaksiHariIni: 0,
    perubahanStok: 0
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch transaksi masuk
      const masukResponse = await stockapi.getAll({ 
        jenis_transaksi: 'IN',
        limit: 100
      });
      const transaksiMasuk = masukResponse.data?.data || [];
      
      // Fetch transaksi keluar
      const keluarResponse = await stockapi.getAll({ 
        jenis_transaksi: 'OUT',
        limit: 100
      });
      const transaksiKeluar = keluarResponse.data?.data || [];
      
      // Gabungkan dan sort berdasarkan tanggal terbaru
      const allTransactions = [...transaksiMasuk, ...transaksiKeluar].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Hitung transaksi hari ini
      const today = new Date().toDateString();
      const transaksiHariIni = allTransactions.filter(
        t => new Date(t.created_at).toDateString() === today
      ).length;
      
      // Hitung total masuk dan keluar
      const totalMasuk = transaksiMasuk.reduce((sum, t) => sum + (t.jumlah || 0), 0);
      const totalKeluar = transaksiKeluar.reduce((sum, t) => sum + (t.jumlah || 0), 0);
      
      setStats({
        totalMasuk,
        totalKeluar,
        transaksiHariIni,
        perubahanStok: totalMasuk - totalKeluar
      });
      
      // Ambil 10 transaksi terakhir
      setRecentTransactions(allTransactions.slice(0, 10));
      
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter transactions based on active tab
  const filteredTransactions = recentTransactions.filter(transaction => {
    if (activeTab === 'semua') return true;
    if (activeTab === 'masuk') return transaction.jenis_transaksi === 'IN';
    if (activeTab === 'keluar') return transaction.jenis_transaksi === 'OUT';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Selamat Datang! </h1>
        <p className="text-purple-100">Kelola inventory Anda dengan mudah dan efisien</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <PackagePlus className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalMasuk}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Barang Masuk</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <PackageMinus className="w-6 h-6 text-red-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalKeluar}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Barang Keluar</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.transaksiHariIni}</h3>
          <p className="text-sm text-gray-600 mt-1">Transaksi Hari Ini</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-lg ${stats.perubahanStok >= 0 ? 'bg-purple-100' : 'bg-orange-100'}`}>
              <Package className={`w-6 h-6 ${stats.perubahanStok >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
            </div>
            {stats.perubahanStok >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <h3 className={`text-2xl font-bold ${stats.perubahanStok >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.perubahanStok >= 0 ? '+' : ''}{stats.perubahanStok}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Perubahan Stok Bersih</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('qr-scanner')}
          className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg mb-1">Scan QR Code</h4>
              <p className="text-sm text-purple-100">Scan produk dengan QR</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('barang-masuk')}
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
              <PackagePlus className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg mb-1">Barang Masuk</h4>
              <p className="text-sm text-blue-100">Input barang masuk</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('barang-keluar')}
          className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
              <PackageMinus className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-lg mb-1">Barang Keluar</h4>
              <p className="text-sm text-red-100">Input barang keluar</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Transaksi Terbaru</h2>
          <p className="text-sm text-gray-500">10 transaksi terakhir</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('semua')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'semua' 
                ? 'text-white bg-purple-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semua
          </button>
          <button 
            onClick={() => setActiveTab('masuk')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'masuk' 
                ? 'text-white bg-purple-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Masuk
          </button>
          <button 
            onClick={() => setActiveTab('keluar')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'keluar' 
                ? 'text-white bg-purple-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Keluar
          </button>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada transaksi {activeTab !== 'semua' ? activeTab : ''}</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div 
                key={transaction.transaction_id} 
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    transaction.jenis_transaksi === 'IN' 
                      ? 'bg-blue-50' 
                      : 'bg-red-50'
                  }`}>
                    {transaction.jenis_transaksi === 'IN' ? (
                      <PackagePlus className="w-5 h-5 text-blue-600" />
                    ) : (
                      <PackageMinus className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {transaction.product?.nama_barang || 'Produk tidak ditemukan'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {transaction.product?.kode_barang || '-'} • {formatDate(transaction.created_at)}
                      {transaction.penanggung_jawab && (
                        <span className="ml-2">• {transaction.penanggung_jawab}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className={`text-lg font-bold ${
                  transaction.jenis_transaksi === 'IN' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {transaction.jenis_transaksi === 'IN' ? '+' : '-'}{transaction.jumlah}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardUserPage;