import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Package, DollarSign, TrendingUp, ShoppingCart, Search, Bell, User, Home, Layers, 
  FileText, Settings, LogOut, Calendar, Archive, ClipboardList, FileBarChart, 
  ArrowLeft, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ChevronsLeft, ChevronsRight 
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link

// API Configuration
const API_URL = "http://127.0.0.1:8000/api";

// Konfigurasi Axios
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Interceptor untuk menambahkan token ke setiap request
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthModal = ({ onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '', 
    confirmPassword: ''
  });
  const [authStatus, setAuthStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setAuthStatus({ type: '', message: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthStatus({ type: '', message: '' });
    
    try {
      const response = await axios.post('/login', {
        email: formData.email,
        password: formData.password
      });
      
      setAuthStatus({ type: 'success', message: 'Login berhasil! Mengalihkan...' });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 1500);

    } catch (error) {
      setAuthStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Login gagal. Periksa email dan password Anda.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Masuk ke Akun
          </h2>
          <p className="text-gray-600 text-sm">
            Selamat datang! Silakan masuk untuk melanjutkan.
          </p>
        </div>

        {authStatus.message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            authStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {authStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm">{authStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="nama@email.com"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Masukkan password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link
              to="/register" // Arahkan ke halaman /register
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, bgColor, textColor }) => (
  <div className={`${bgColor} rounded-lg p-6 shadow hover:shadow-lg transition-all duration-300`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-12 h-12 ${textColor}`} />
    </div>
    <h3 className="text-4xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-white/80">{title}</p>
  </div>
);

const DashboardAdmin = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/logout'); 
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const products = [
    { id: 1, name: "Laptop X", costPrice: 8000000, sellPrice: 10000000, stock: 12, sold: 8 },
    { id: 2, name: "Mouse Pro", costPrice: 150000, sellPrice: 250000, stock: 5, sold: 15 },
    { id: 3, name: "Keyboard RGB", costPrice: 300000, sellPrice: 450000, stock: 0, sold: 20 },
    { id: 4, name: "Monitor 4K", costPrice: 3000000, sellPrice: 4500000, stock: 7, sold: 5 },
    { id: 5, name: "Webcam HD", costPrice: 500000, sellPrice: 750000, stock: 10, sold: 12 },
  ];
  const monthlyData = [
    { name: 'Jan', masuk: 0, keluar: 0 }, { name: 'Feb', masuk: 0, keluar: 0 }, { name: 'Mar', masuk: 0, keluar: 0 },
    { name: 'Apr', masuk: 0, keluar: 0 }, { name: 'May', masuk: 0, keluar: 15 }, { name: 'Jun', masuk: 0, keluar: 17 },
  ];
  const pieData = [
    { name: 'Gudang 1', value: 45, color: '#4F46E5' },
    { name: 'Gudang 2', value: 30, color: '#60A5FA' },
    { name: 'Gudang 3', value: 25, color: '#F87171' },
  ];
  const totalProducts = products.length;
  const totalTransaksiMasuk = 17;
  const totalTransaksiKeluar = 16;
  const transactions = [
    { date: '2025-06-28', type: 'Masuk', code: 'BR-1003', name: 'Labels', quantity: 10, warehouse: 'Gudang 2' },
    { date: '2025-06-27', type: 'Keluar', code: 'BR-1002', name: 'Mouse Pro', quantity: 5, warehouse: 'Gudang 1' },
  ];
  if (!isAuthenticated) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-20'} bg-gradient-to-b from-indigo-700 to-indigo-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="p-5 flex items-center gap-3 border-b border-indigo-600">
          <div className="bg-white p-2 rounded-lg">
            <Package className="w-6 h-6 text-indigo-700" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">Inventory System</h1>
              <p className="text-xs text-indigo-200">E.A Project</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <Home className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
          </button>
          <button onClick={() => setActiveView('produk')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'produk' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <Package className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Produk</span>}
          </button>
          <button onClick={() => setActiveView('barang-masuk')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'barang-masuk' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <Archive className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Barang Masuk</span>}
          </button>
          <button onClick={() => setActiveView('barang-keluar')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'barang-keluar' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <ClipboardList className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Barang Keluar</span>}
          </button>
          <button onClick={() => setActiveView('stok-opname')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'stok-opname' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <Layers className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Stok Opname</span>}
          </button>
          <button onClick={() => setActiveView('laporan')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'laporan' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <FileBarChart className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Laporan Opname</span>}
          </button>
          <button onClick={() => setActiveView('kartu-stok')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'kartu-stok' ? 'bg-indigo-600' : 'hover:bg-indigo-600/50'}`}>
            <FileText className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Kartu Stok</span>}
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-indigo-600 space-y-1">
          {/* Tombol Settings diganti jadi Toggle Sidebar */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-600/50 transition-colors"
            title={sidebarOpen ? "Kecilkan Sidebar" : "Perluas Sidebar"}
          >
            {/* Ikon berubah sesuai state sidebarOpen */}
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5 mx-auto" />}
            {sidebarOpen && <span className="text-sm font-medium">Tutup Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Dashboard
            </h2>
            
            {/* Tampilan Header setelah Login */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                Selamat Pagi, <span className="font-semibold">{user?.name || user?.email || 'Admin'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Produk"
                value={totalProducts}
                icon={Package}
                bgColor="bg-gradient-to-br from-indigo-600 to-indigo-700"
                textColor="text-white"
              />
              <StatCard
                title="Total Transaksi Masuk"
                value={totalTransaksiMasuk}
                icon={Archive}
                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                textColor="text-white"
              />
              <StatCard
                title="Total Transaksi Keluar"
                value={totalTransaksiKeluar}
                icon={ShoppingCart}
                bgColor="bg-gradient-to-br from-red-400 to-red-500"
                textColor="text-white"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Section */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Grafik Transaksi</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded font-medium">
                      Bulanan
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                      Harian
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 text-center mb-2">Transaksi 6 Bulan Terakhir</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-indigo-600"></div>
                      <span className="text-gray-600">Barang Masuk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-red-400"></div>
                      <span className="text-gray-600">Barang Keluar</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                    <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Line type="monotone" dataKey="masuk" stroke="#4F46E5" strokeWidth={2} name="Barang Masuk" />
                    <Line type="monotone" dataKey="keluar" stroke="#F87171" strokeWidth={2} name="Barang Keluar" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Jumlah Stok per Gudang</h3>
                
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{backgroundColor: item.color}}></div>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">10 Transaksi Terakhir</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-indigo-700 text-white">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Tanggal</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Tipe</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Kode Barang</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Nama Barang</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold">Jumlah</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Gudang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">{transaction.date}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                            transaction.type === 'Masuk'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{transaction.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{transaction.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 text-center">{transaction.quantity}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{transaction.warehouse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;