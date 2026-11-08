# Product API

REST API manajemen produk dengan **Express.js + TypeScript**, **MySQL**, **JWT**, **bcrypt**, **Multer**, dan **Cloudinary**.

## Struktur

```
src/
├── config/        env (validasi .env), db (mysql2 pool), cloudinary
├── controllers/   auth.controller.ts, product.controller.ts
├── middlewares/   auth (JWT), upload (Multer), error (handler terpusat)
├── routes/        auth.routes.ts, product.routes.ts
├── utils/         httpError, asyncHandler, cloudinaryUpload
├── types/         augmentasi tipe Express (req.user)
├── app.ts         setup Express
└── server.ts      entry point
sql/schema.sql     skema tabel users & products (dijalankan manual di MySQL)
```

## Menjalankan

1. Install dependency
   ```bash
   npm install
   ```
2. Buat database dan tabel di MySQL (phpMyAdmin, MySQL Workbench, atau terminal). Jalankan isi `sql/schema.sql`, atau buat sendiri dengan nama tabel/kolom yang sama persis:
   ```bash
   mysql -u root -p < sql/schema.sql
   ```
3. Salin `.env.example` menjadi `.env`, lalu isi `DB_*`, `JWT_SECRET`, dan kredensial Cloudinary. Nilai `DB_NAME` harus sama dengan nama database yang dibuat (default `product_db`).
4. Jalankan server
   ```bash
   npm run dev                  # mode development (watch)
   npm run build && npm start   # production
   ```

Server berjalan di `http://localhost:3000`. Aplikasi **tidak** membuat tabel otomatis; jika tabel belum ada, request akan error.

### Kolom yang dipakai kode

- `users`: `id`, `username` (unik), `email` (unik), `password`, `created_at`
- `products`: `id`, `name`, `category`, `price`, `stock`, `description`, `image_url`, `image_public_id`, `created_by` (FK ke `users.id`), `created_at`

## Endpoint

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| POST | `/api/auth/register` | - | Daftar akun baru (password di-hash bcrypt) |
| POST | `/api/auth/login` | - | Login, mengembalikan JWT |
| POST | `/api/products` | Bearer JWT | Tambah produk (multipart/form-data) |
| GET | `/api/products` | - | Seluruh produk dalam JSON |
| GET | `/health` | - | Cek status API |

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"budi","email":"budi@mail.com","password":"rahasia123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@mail.com","password":"rahasia123"}'
```

Respons berisi `data.token`.

### Create Product

Kirim sebagai `multipart/form-data`. Field gambar bernama `image` (JPEG/PNG/WEBP/GIF, maks 5 MB).

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=Kemeja Flannel" \
  -F "category=Fashion" \
  -F "price=185000" \
  -F "stock=40" \
  -F "description=Kemeja flannel lengan panjang" \
  -F "image=@./kemeja.jpg"
```

### Read Products

```bash
curl http://localhost:3000/api/products
```

Contoh respons:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "Kemeja Flannel",
      "category": "Fashion",
      "price": 185000,
      "stock": 40,
      "description": "Kemeja flannel lengan panjang",
      "imageUrl": "https://res.cloudinary.com/.../products/abc123.jpg",
      "createdBy": 1,
      "createdAt": "2026-11-08T12:00:00.000Z"
    }
  ]
}
```

## Catatan desain

- Password di-hash dengan bcrypt (10 salt rounds) dan tidak pernah dikembalikan di respons.
- Pesan error login sengaja sama untuk email salah maupun password salah.
- Validasi input memakai Zod; error dikembalikan dengan status 400 dan detail per field.
- Gambar diterima Multer di memori lalu di-stream ke Cloudinary (folder `products`). Jika insert database gagal, gambar yang sudah terunggah dihapus kembali.
- `GET /api/products` dibuat publik. Untuk membuatnya wajib login, tambahkan middleware `authenticate` pada route tersebut di `src/routes/product.routes.ts`.
