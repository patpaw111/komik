Get started here
SSSS Komik API menyediakan endpoint untuk mengelola data komik, seperti daftar series, detail series, serta operasi CRUD dasar.
API ini dirancang simple, supaya gampang dipakai dari dashboard admin maupun dari client lain (misalnya mobile app).
Saat ini API yang tersedia (v1, basic):
GET /api/series – list semua komik dengan pagination
POST /api/series – tambah komik baru
GET /api/series/{id} – ambil detail 1 komik
PATCH /api/series/{id} – update data komik
DELETE /api/series/{id} – hapus komik
Getting started guide
Untuk mulai pakai SSSS Komik API:
Jalankan aplikasi Next.js secara lokal:
npm install
npm run dev
Base URL default: http://localhost:3000
Pastikan environment Supabase sudah di-setup:
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
Kirim request ke endpoint API melalui Postman (atau tool lain), misalnya:
GET http://localhost:3000/api/series
POST http://localhost:3000/api/series dengan body JSON.
Catatan umum:
Semua response dikembalikan dalam format JSON.
Untuk error, API akan mengembalikan status code HTTP (misalnya 400, 404, 500) dengan pesan error di body.
Authentication
Saat ini SSSS Komik API versi dev belum menggunakan mekanisme auth/token di level HTTP.
API berjalan di lingkungan backend Next.js yang sudah terhubung dengan Supabase.
Akses terproteksi terutama di level database melalui Row Level Security (RLS) dan penggunaan service role key di server.
Service role key tidak pernah dikirim ke client dan hanya dipakai di kode server (/src/lib/supabase/server.ts).
Untuk production, planned:
Menambahkan mekanisme auth (misalnya Supabase Auth / JWT) sebelum mengizinkan operasi POST, PATCH, dan DELETE.
Authentication error response
Karena saat ini belum ada auth header khusus di layer HTTP:
Error yang muncul biasanya terkait:
Konfigurasi Supabase (URL/key salah).
Query ke database gagal (contoh: constraint, slug duplikat, dsb).
Response error menggunakan status code standar:
400 Bad Request – input/body tidak valid (misalnya title atau slug kosong).
404 Not Found – data tidak ditemukan (misalnya id series tidak ada).
500 Internal Server Error – error di sisi server/DB.
Rate and usage limits
Untuk environment dev/lokal:
Tidak ada rate limit khusus yang diterapkan di level API.
Batasan utama berasal dari:
Kapasitas server lokal.
Batas default dari Supabase (kalau nanti di-host beneran).
Di environment production (rencana ke depan), bisa ditambahkan:
Rate limiting per IP / per token.
Response 429 Too Many Requests jika melewati batas.
503 response
Jika suatu saat API mengembalikan 5xx (misalnya 500 atau 503):
Biasanya terjadi karena:
Koneksi ke Supabase terganggu.
Ada perubahan schema DB tapi API belum disesuaikan.
Coba:
Cek log server Next.js.
Pastikan Supabase URL dan key di .env sudah benar.
Restart dev server: npm run dev ulang.