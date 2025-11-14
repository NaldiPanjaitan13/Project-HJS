import React, { useState } from 'react';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';

// --- 1. Komponen Navbar ---
function Navbar({ navigateTo }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-lg z-50 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Project HJS</h1>
          </div>
          
          {/* Navigasi Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <a href="#home" onClick={() => navigateTo('home')} className="text-gray-600 hover:text-blue-600 transition">Beranda</a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Fitur</a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition">Tentang</a>
          </div>

          {/* Tombol Aksi Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => navigateTo('login')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <LogIn size={16} />
              Masuk
            </button>
            <button
              onClick={() => navigateTo('register')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition"
            >
              <UserPlus size={16} />
              Daftar
            </button>
          </div>

          {/* Tombol Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#home" onClick={() => { navigateTo('home'); setIsMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Beranda</a>
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Fitur</a>
            <a href="#about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">Tentang</a>
          </div>
          <div className="px-4 pb-4 border-t border-gray-200">
            <button
              onClick={() => { navigateTo('login'); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <LogIn size={16} />
              Masuk
            </button>
            <button
              onClick={() => { navigateTo('register'); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition"
            >
              <UserPlus size={16} />
              Daftar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
