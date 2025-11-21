import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, Home, Archive, ClipboardList, Layers, 
  FileBarChart, FileText, LogOut, ChevronsLeft, ChevronsRight, User, X 
} from 'lucide-react';
import DashboardPageAdmin from './admin/DashboardPageAdmin';
import ProductManagementAdmin from './admin/ProductManagementAdmin';
import BarangMasukAdmin from './admin/BarangMasukAdmin';
import BarangKeluarAdmin from './admin/BarangKeluarAdmin';
import StokOpnameAdmin from './admin/StokOpnameAdmin';
import LaporanAdmin from './admin/LaporanAdmin';
import KartuStokAdmin from './admin/KartuStokAdmin';

const DashboardAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'produk', label: 'Produk', icon: Package },
    { id: 'barang-masuk', label: 'Barang Masuk', icon: Archive },
    { id: 'barang-keluar', label: 'Barang Keluar', icon: ClipboardList },
    { id: 'stok-opname', label: 'Stok Opname', icon: Layers },
    { id: 'laporan', label: 'Laporan', icon: FileBarChart },
    { id: 'kartu-stok', label: 'Kartu Stok', icon: FileText },
  ];

  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLogout = () => {
    setShowConfirmModal(false); 
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('emailVerified');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('emailVerified');
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowConfirmModal(false);
  };

  const renderActivePage = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardPageAdmin />;
      case 'produk':
        return <ProductManagementAdmin />;
      case 'barang-masuk':
        return <BarangMasukAdmin />;
      case 'barang-keluar':
        return <BarangKeluarAdmin />;
      case 'stok-opname':
        return <StokOpnameAdmin />;
      case 'laporan':
        return <LaporanAdmin />;
      case 'kartu-stok':
        return <KartuStokAdmin />;
      default:
        return <DashboardPageAdmin />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      {/* ... (kode sidebar) ... */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-indigo-700 to-indigo-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        
        {/* Logo */}
        <div className="p-5 border-b border-indigo-600 flex items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl shadow-lg">
            <Package className="w-7 h-7 text-indigo-700" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">Inventory System</h1>
              <p className="text-xs text-indigo-200">E.A Project</p>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'hover:bg-indigo-600/50 text-indigo-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-indigo-600">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-600/50 transition-colors"
            title={sidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          >
            {sidebarOpen ? (
              <>
                <ChevronsLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Tutup Sidebar</span>
              </>
            ) : (
              <ChevronsRight className="w-5 h-5 mx-auto" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola sistem inventory Anda
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    {user.name || user.email || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              
              {/* Logout Button (Memanggil handleLogoutClick) */}
              <button 
                onClick={handleLogoutClick} 
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                title="Keluar dari sistem"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderActivePage()}
        </div>
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LogOut className="w-6 h-6 text-red-600" />
                Konfirmasi Keluar
              </h3>
              <button 
                onClick={handleCancelLogout} 
                className="text-gray-400 hover:text-gray-600"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem inventory?
            </p>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                Yakin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;