import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { pool } from "../config/db";
import { deleteImage, uploadImage } from "../utils/cloudinaryUpload";
import { HttpError } from "../utils/httpError";

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi").max(150),
  category: z.string().trim().min(1, "Kategori wajib diisi").max(100),
  price: z.coerce.number({ invalid_type_error: "Harga harus berupa angka" }).nonnegative("Harga tidak boleh negatif"),
  stock: z.coerce
    .number({ invalid_type_error: "Stok harus berupa angka" })
    .int("Stok harus bilangan bulat")
    .nonnegative("Stok tidak boleh negatif"),
  description: z.string().trim().default(""),
});

const PRODUCT_COLUMNS = `
  id,
  name,
  category,
  price,
  stock,
  description,
  image_url AS imageUrl,
  created_by AS createdBy,
  created_at AS createdAt
`;

export async function createProduct(req: Request, res: Response) {
  const data = createProductSchema.parse(req.body);

  if (!req.file) {
    throw new HttpError(400, "Gambar produk wajib diunggah (field form-data: image)");
  }

  const uploaded = await uploadImage(req.file.buffer);

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products (name, category, price, stock, description, image_url, image_public_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.category,
        data.price,
        data.stock,
        data.description,
        uploaded.secure_url,
        uploaded.public_id,
        req.user!.id,
      ],
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: rows[0],
    });
  } catch (err) {
    // Hindari gambar yatim di Cloudinary jika insert ke database gagal.
    await deleteImage(uploaded.public_id);
    throw err;
  }
}

export async function getProducts(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY created_at DESC, id DESC`,
  );

  res.json({
    success: true,
    count: rows.length,
    data: rows,
  });
}
