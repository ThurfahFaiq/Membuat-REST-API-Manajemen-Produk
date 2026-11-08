import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export function uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Upload ke Cloudinary gagal"));
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Gagal menghapus gambar di Cloudinary:", err);
  }
}
