import React, { useState, useEffect } from 'react';
import { Package, Archive, ShoppingCart, AlertTriangle, TrendingUp, Calendar, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';
import { productapi } from '../../services/productapi';
import { stockapi } from '../../services/stockapi';

const DashboardPageAdmin = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockIn: 0,
    totalStockOut: 0,
    lowStockProducts: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [period, setPeriod] = useState('all');
  const [filteredStats, setFilteredStats] = useState({
    totalIn: 0,
    totalOut: 0,
    transactionsIn: [],
    transactionsOut: []
  });

  // ✅ SINGLE useEffect untuk fetch - hanya dipanggil sekali saat mount
  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array

  // ✅ PARALLEL REQUESTS menggunakan Promise.all
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ Fetch semua data secara PARALLEL, bukan sequential
      const [productsResponse, stockSummary, transactionsResponse] = await Promise.all([
        productapi.getAll(),
        stockapi.getSummary(),
        stockapi.getAll({ per_page: 100 })
      ]);

      // Process products
      const products = productsResponse.data?.data || [];
      
      // Process low stock items
      const lowStock = products.filter(p => 
        p.stok_minimal && p.stok <= p.stok_minimal
      );
      
      // Set stats
      setStats({
        totalProducts: products.length,
        totalStockIn: stockSummary.data?.total_in || 0,
        totalStockOut: stockSummary.data?.total_out || 0,
        lowStockProducts: lowStock.length
      });
      
      setLowStockItems(lowStock.slice(0, 5));
      
      // Set transactions
      const allTransactions = transactionsResponse.data?.data || [];
      setRecentTransactions(allTransactions);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter effect - hanya re-calculate ketika period atau transactions berubah
  useEffect(() => {
    const { start, end } = getDateRange(period);
    
    let filtered = recentTransactions;
    
    if (start && end) {
      filtered = recentTransactions.filter(t => {
        const transDate = new Date(t.created_at);
        return transDate >= start && transDate <= end;
      });
    }

    const transIn = filtered.filter(t => t.jenis_transaksi === 'IN');
    const transOut = filtered.filter(t => t.jenis_transaksi === 'OUT');

    setFilteredStats({
      totalIn: transIn.reduce((sum, t) => sum + t.jumlah, 0),
      totalOut: transOut.reduce((sum, t) => sum + t.jumlah, 0),
      transactionsIn: transIn,
      transactionsOut: transOut
    });
  }, [period, recentTransactions]);

  const getDateRange = (periodType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (periodType === 'today') {
      return { start: today, end: now };
    }
    
    if (periodType === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { start: weekStart, end: now };
    }
    
    if (periodType === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    
    return { start: null, end: null };
  };

  const StatCard = ({ title, value, icon: Icon, iconColor, bgColor }) => (
    <div className={`${bgColor} rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600 font-medium">{title}</p>
    </div>
  );

  const PeriodButton = ({ label, value }) => (
    <button
      onClick={() => setPeriod(value)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        period === value
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Harian';
      case 'week': return 'Mingguan';
      case 'month': return 'Bulanan';
      default: return 'Semua Waktu';
    }
  };

  // Calculate percentage for visual bar
  const maxValue = Math.max(filteredStats.totalIn, filteredStats.totalOut, 1);
  const inPercent = (filteredStats.totalIn / maxValue) * 100;
  const outPercent = (filteredStats.totalOut / maxValue) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Selamat Datang di Dashboard Admin</h1>
            <p className="text-indigo-100">Pantau dan kelola inventory Anda secara real-time</p>
          </div>
          <TrendingUp className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Produk"
          value={stats.totalProducts}
          icon={Package}
          iconColor="bg-indigo-600"
          bgColor="bg-white"
        />
        <StatCard
          title="Total Barang Masuk"
          value={stats.totalStockIn}
          icon={Archive}
          iconColor="bg-blue-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Total Barang Keluar"
          value={stats.totalStockOut}
          icon={ShoppingCart}
          iconColor="bg-green-500"
          bgColor="bg-white"
        />
        <StatCard
          title="Stok Menipis"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          iconColor="bg-red-500"
          bgColor="bg-white"
        />
      </div>

      {/* Stock Summary dengan Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ringkasan Stok</h3>
                <p className="text-sm text-gray-500">Perbandingan barang masuk & keluar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PeriodButton label="Harian" value="today" />
              <PeriodButton label="Mingguan" value="week" />
              <PeriodButton label="Bulanan" value="month" />
              <PeriodButton label="Semua" value="all" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barang Masuk Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <ArrowUpCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Barang Masuk</p>
                    <p className="text-xs text-blue-500">{getPeriodLabel()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-700">{filteredStats.totalIn}</p>
                  <p className="text-sm text-blue-500">{filteredStats.transactionsIn.length} transaksi</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${inPercent}%` }}
                />
              </div>
            </div>

            {/* Barang Keluar Card */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                    <ArrowDownCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Barang Keluar</p>
                    <p className="text-xs text-red-500">{getPeriodLabel()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-700">{filteredStats.totalOut}</p>
                  <p className="text-sm text-red-500">{filteredStats.transactionsOut.length} transaksi</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${outPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Net Stock Change */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className={`w-6 h-6 ${filteredStats.totalIn - filteredStats.totalOut >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-gray-600 font-medium">Perubahan Stok Bersih ({getPeriodLabel()})</span>
              </div>
              <span className={`text-2xl font-bold ${filteredStats.totalIn - filteredStats.totalOut >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {filteredStats.totalIn - filteredStats.totalOut >= 0 ? '+' : ''}{filteredStats.totalIn - filteredStats.totalOut}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
            <p className="text-sm text-gray-500 mt-1">10 transaksi terakhir</p>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 10).map((transaction, index) => (
                  <div 
                    key={transaction.transaction_id || index} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.jenis_transaksi === 'IN' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.jenis_transaksi === 'IN' ? 
                          <Archive className="w-5 h-5" /> : 
                          <ShoppingCart className="w-5 h-5" />
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {transaction.product?.nama_barang || 'Produk'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${
                      transaction.jenis_transaksi === 'IN' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {transaction.jenis_transaksi === 'IN' ? '+' : '-'}{transaction.jumlah}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Peringatan Stok Menipis</h3>
              <p className="text-sm text-gray-500">Produk yang perlu direstock</p>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">Semua stok aman</p>
                <p className="text-sm text-gray-400">Tidak ada produk dengan stok menipis</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div 
                    key={item.product_id} 
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.nama_barang}</p>
                      <p className="text-xs text-gray-600">{item.kode_barang}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Stok: <span className="font-bold text-red-600">{item.stok}</span>
                      </p>
                      <p className="text-xs text-gray-500">Min: {item.stok_minimal}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageAdmin;