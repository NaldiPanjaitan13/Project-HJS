import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  PackagePlus, 
  PackageMinus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  Clock
} from 'lucide-react';
import { stockapi } from '../../services/stockapi';

const DashboardPageUser = () => {
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
      
      const masukResponse = await stockapi.getAll({ 
        jenis_transaksi: 'IN',
        limit: 100
      });
      const transaksiMasuk = masukResponse.data?.data || [];
      
      const keluarResponse = await stockapi.getAll({ 
        jenis_transaksi: 'OUT',
        limit: 100
      });
      const transaksiKeluar = keluarResponse.data?.data || [];
      
      const allTransactions = [...transaksiMasuk, ...transaksiKeluar].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      const today = new Date().toDateString();
      const transaksiHariIni = allTransactions.filter(
        t => new Date(t.created_at).toDateString() === today
      ).length;
      
      const totalMasuk = transaksiMasuk.reduce((sum, t) => sum + (t.jumlah || 0), 0);
      const totalKeluar = transaksiKeluar.reduce((sum, t) => sum + (t.jumlah || 0), 0);
      
      setStats({
        totalMasuk,
        totalKeluar,
        transaksiHariIni,
        perubahanStok: totalMasuk - totalKeluar
      });
      
      setRecentTransactions(allTransactions.slice(0, 10));
      
    } catch {
      console.error('Gagal mengambil data dashboard');
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

  const filteredTransactions = recentTransactions.filter(t => {
    if (activeTab === 'semua') return true;
    return t.jenis_transaksi === activeTab;
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
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Selamat Datang di Dashboard User</h3>
            <p className="text-purple-100">Pantau dan kelola inventory Anda secara real-time</p>
          </div>
          <QrCode className="w-20 h-20 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Barang Masuk */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PackagePlus className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalMasuk}</h3>
          <p className="text-sm text-gray-500 font-medium">Total Barang Masuk</p>
        </div>

        {/* Total Barang Keluar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <PackageMinus className="w-6 h-6 text-red-600" />
            </div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalKeluar}</h3>
          <p className="text-sm text-gray-500 font-medium">Total Barang Keluar</p>
        </div>

        {/* Transaksi Hari Ini */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.transaksiHariIni}</h3>
          <p className="text-sm text-gray-500 font-medium">Transaksi Hari Ini</p>
        </div>

        {/* Perubahan Stok */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${stats.perubahanStok >= 0 ? 'bg-purple-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}>
              <Package className={`w-6 h-6 ${stats.perubahanStok >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
            </div>
            {stats.perubahanStok >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-orange-500" />
            )}
          </div>
          <h3 className={`text-3xl font-bold mb-1 ${stats.perubahanStok >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.perubahanStok >= 0 ? '+' : ''}{stats.perubahanStok}
          </h3>
          <p className="text-sm text-gray-500 font-medium">Perubahan Stok Bersih</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <button className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 group">
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

        <button className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 group">
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

        <button className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl p-6 hover:shadow-xl transition-all transform hover:scale-105 group">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
          <p className="text-sm text-gray-500">10 transaksi terakhir</p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
          <button 
            onClick={() => setActiveTab('semua')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'semua' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button 
            onClick={() => setActiveTab('IN')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'IN' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Masuk
          </button>
          <button 
            onClick={() => setActiveTab('OUT')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'OUT' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Keluar
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Belum ada transaksi</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.transaction_id} className="px-6 py-4 hover:bg-gray-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      transaction.jenis_transaksi === 'IN' 
                        ? 'bg-blue-100' 
                        : 'bg-red-100'
                    }`}>
                      {transaction.jenis_transaksi === 'IN' ? (
                        <PackagePlus className="w-6 h-6 text-blue-600" />
                      ) : (
                        <PackageMinus className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.product?.nama_barang || 'Produk tidak ditemukan'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.product?.kode_barang || '-'} • {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
                      transaction.jenis_transaksi === 'IN'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.jenis_transaksi === 'IN' ? '+' : '-'}{transaction.jumlah}
                    </span>
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

export default DashboardPageUser;