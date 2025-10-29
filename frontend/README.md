Frontend: React Application

Aplikasi tampilan ini dibuat menggunakan React dan Vite. Frontend berfungsi sebagai Single Page Application (SPA) yang fokus pada presentasi data, interaksi pengguna, dan routing di sisi klien.

⚙️ Teknologi Utama

Framework: React.js (Hooks & Functional Components)

Bundler: Vite

Styling: Tailwind CSS / CSS Modules

HTTP Client: Axios atau Fetch API

State Management: React Hooks (useState, useContext)

🛠️ Instalasi dan Menjalankan

Langkah-langkah ini harus dilakukan di direktori /frontend:

Instal Dependensi JavaScript:
Pastikan Anda memiliki Node.js (v18+) dan npm terinstal.

npm install


Konfigurasi Variabel Lingkungan:
Buat file .env.local (atau .env) di direktori /frontend dan tambahkan URL API backend:

# Pastikan ini menunjuk ke server Laravel Anda
VITE_API_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)


Jalankan Aplikasi Development:

npm run dev


Aplikasi akan terbuka di browser Anda (misalnya http://localhost:5173).

📡 Koneksi API

Semua permintaan data (GET, POST, PUT, DELETE) dari aplikasi React diarahkan ke base URL yang didefinisikan dalam VITE_API_URL. Pastikan server Backend sedang berjalan sebelum menjalankan Frontend.