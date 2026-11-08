import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { pool } from "../config/db";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

const SALT_ROUNDS = 10;

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72, "Password maksimal 72 karakter"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function register(req: Request, res: Response) {
  const { username, email, password } = registerSchema.parse(req.body);

  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT email, username FROM users WHERE email = ? OR username = ? LIMIT 1",
    [email, username],
  );
  if (existing.length > 0) {
    const field = existing[0].email === email ? "Email" : "Username";
    throw new HttpError(409, `${field} sudah terdaftar`);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashed],
  );

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, username, email, created_at AS createdAt FROM users WHERE id = ?",
    [result.insertId],
  );

  res.status(201).json({
    success: true,
    message: "Registrasi berhasil",
    data: rows[0],
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, username, email, password FROM users WHERE email = ?",
    [email],
  );
  const user = rows[0];

  // Pesan sengaja sama agar tidak membocorkan apakah email terdaftar.
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    throw new HttpError(401, "Email atau password salah");
  }

  const token = jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

  res.json({
    success: true,
    message: "Login berhasil",
    data: {
      token,
      user: { id: user.id, username: user.username, email: user.email },
    },
  });
}
