import React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';

// --- 3. Komponen Footer ---
function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-400 py-12 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="mb-4">&copy; 2025 Project HJS. Dibuat dengan React & Laravel.</p>
        <div className="flex justify-center space-x-6">
          <a href="#" className="hover:text-white transition"><Github size={20} /></a>
          <a href="#" className="hover:text-white transition"><Linkedin size={20} /></a>
          <a href="#" className="hover:text-white transition"><Twitter size={20} /></a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;