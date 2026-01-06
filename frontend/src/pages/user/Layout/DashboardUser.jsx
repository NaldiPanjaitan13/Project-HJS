import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Home, QrCode, PackagePlus, PackageMinus,
  LogOut, ChevronsLeft, ChevronsRight, 
  User, X, Menu 
} from 'lucide-react';
import DashboardUserPage from '../DashboardUserPage';
import QRScannerUser from '../ScanQRcodePage';
import BarangMasukUser from '../BarangMasukUser';
import BarangKeluarUser from '../BarangKeluarUser';

const DashboardUser = () => {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'qr-scanner', label: 'Scan QR Code', icon: QrCode },
    { id: 'barang-masuk', label: 'Barang Masuk', icon: PackagePlus },
    { id: 'barang-keluar', label: 'Barang Keluar', icon: PackageMinus },
  ];

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    setIsMobileMenuOpen(false);
  };

  // Fungsi untuk navigasi dari dashboard buttons
  const handleNavigateFromDashboard = (menuId) => {
    setActiveMenu(menuId);
  };

  const handleLogoutClick = () => setShowConfirmModal(true);

  const handleConfirmLogout = () => {
    setShowConfirmModal(false); 
    localStorage.clear(); 
    sessionStorage.clear();
    navigate('/login');
  };

  const renderActivePage = () => {
    const components = {
      'dashboard': <DashboardUserPage onNavigate={handleNavigateFromDashboard} />,
      'qr-scanner': <QRScannerUser />,
      'barang-masuk': <BarangMasukUser />,
      'barang-keluar': <BarangKeluarUser />
    };
    return components[activeMenu] || <DashboardUserPage onNavigate={handleNavigateFromDashboard} />;
  };

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden">
      
      {/* --- MOBILE OVERLAY (Backdrop) --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Responsive) --- */} 
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-30
          bg-gradient-to-b from-purple-700 to-purple-900 text-white 
          transition-all duration-300 ease-in-out flex flex-col shadow-2xl
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-20'}
          w-64 
        `}
      >
        {/* Logo Area */}
        <div className="p-5 border-b border-purple-600 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-xl shadow-lg">
              <Package className="w-7 h-7 text-purple-700" />
            </div>
            <div className={`${!isDesktopSidebarOpen && 'md:hidden'} transition-opacity duration-300`}>
              <h1 className="text-lg font-bold whitespace-nowrap">Inventoris App</h1>
              <p className="text-xs text-purple-200">User Panel</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white hover:bg-purple-600 p-1 rounded-md"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  active:scale-95 outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent
                  ${isActive 
                    ? 'bg-purple-600 text-white shadow-lg font-medium' 
                    : 'hover:bg-purple-600/50 text-purple-100'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-purple-200'}`} />
                
                <span className={`whitespace-nowrap transition-opacity duration-300 ${!isDesktopSidebarOpen ? 'md:hidden' : 'block'}`}>
                  {item.label}
                </span>

                {!isDesktopSidebarOpen && (
                  <div className="hidden md:group-hover:block absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Desktop Toggle) */}
        <div className="hidden md:block px-3 py-4 border-t border-purple-600">
          <button 
            onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-600/50 transition-colors"
          >
            {isDesktopSidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
            {isDesktopSidebarOpen && <span className="text-sm font-medium">Tutup Menu</span>}
          </button>
        </div>
        
        {/* Mobile Footer User Info */}
        <div className="md:hidden p-4 border-t border-purple-600 bg-purple-800/50">
           <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-500 rounded-full p-2">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                 <p className="text-sm font-medium">{user.name || 'User'}</p>
                 <p className="text-xs text-purple-200">User</p>
              </div>
           </div>
           <button 
             onClick={handleLogoutClick}
             className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/80 rounded-lg text-sm"
           >
             <LogOut className="w-4 h-4" /> Logout
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  {menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}
                </h2>
                <p className="hidden sm:block text-sm text-gray-500 mt-0.5">
                  Kelola sistem inventory Anda
                </p>
              </div>
            </div>
            
            {/* Desktop User & Logout Area */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    {user.name || user.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">User</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                   <User className="w-5 h-5" />
                </div>
              </div>
              
              <button 
                onClick={handleLogoutClick} 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all shadow-sm hover:shadow active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>

            {/* Mobile User Avatar Only */}
            <div className="md:hidden">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 border border-purple-200">
                   <User className="w-5 h-5" />
                </div>
            </div>

          </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {renderActivePage()}
          </div>
        </div>
      </main>

      {/* --- MODAL KONFIRMASI LOGOUT --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowConfirmModal(false)}></div>
           
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
             <div className="p-6 text-center">
               <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                 <LogOut className="w-6 h-6 text-red-600" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
               <p className="text-sm text-gray-500 mb-6">
                 Apakah Anda yakin ingin mengakhiri sesi ini? Anda harus login kembali untuk masuk.
               </p>
               <div className="flex gap-3">
                 <button
                   onClick={() => setShowConfirmModal(false)}
                   className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                 >
                   Batal
                 </button>
                 <button
                   onClick={handleConfirmLogout}
                   className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                 >
                   Ya, Keluar
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardUser;