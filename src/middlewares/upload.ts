import multer from "multer";
import { HttpError } from "../utils/httpError";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Disimpan di memori lalu di-stream ke Cloudinary (tidak ada file tersisa di disk).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new HttpError(400, "Format gambar harus JPEG, PNG, WEBP, atau GIF"));
    }
    cb(null, true);
  },
});
