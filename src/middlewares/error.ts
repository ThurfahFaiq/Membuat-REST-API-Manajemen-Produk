import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validasi gagal",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran gambar maksimal 5 MB" : `Upload gagal: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // Pelanggaran UNIQUE di MySQL (mis. dua request register bersamaan)
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Data sudah terdaftar" });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
}
