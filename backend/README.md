Backend: Laravel RESTful API

Direktori ini berisi kode sumber untuk RESTful API yang dibuat dengan Laravel. Backend ini adalah lapisan service yang bertanggung jawab atas logika bisnis, otentikasi, dan manajemen database.

⚙️ Teknologi Utama

Framework: Laravel (PHP)

Database: MySQL

Autentikasi: Laravel Sanctum (disarankan untuk SPA) atau Passport

Server: PHP Built-in Server atau Nginx/Apache

🛠️ Instalasi dan Menjalankan

Langkah-langkah ini harus dilakukan di direktori /backend:

Instal Dependensi PHP:
Pastikan Anda memiliki PHP (v8.1+) dan Composer terinstal.

composer install


Konfigurasi Database dan Lingkungan:
Salin file .env.example ke .env dan atur kunci unik serta kredensial database Anda.

cp .env.example .env
php artisan key:generate


Atur variabel DB_DATABASE, DB_USERNAME, dan DB_PASSWORD dengan benar di file .env.

Migrasi dan Seeding Database:

php artisan migrate --seed


Jalankan Server Development:

php artisan serve


API akan berjalan, biasanya di http://127.0.0.1:8000.

🔑 Autentikasi dan Endpoint

Metode

Endpoint

Deskripsi

POST

/api/register

Pendaftaran pengguna baru.

POST

/api/login

Otentikasi dan pemberian token.

GET

/api/user

Mendapatkan data pengguna yang sedang login (Membutuhkan Token Bearer).