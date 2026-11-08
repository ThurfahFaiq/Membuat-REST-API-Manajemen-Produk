import app from "./app";
import { pool } from "./config/db";
import { env } from "./config/env";

async function start() {
  // Pastikan database dapat dijangkau sebelum menerima request.
  await pool.query("SELECT 1");
  console.log("Terhubung ke database");

  app.listen(env.PORT, () => {
    console.log(`Server berjalan di http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error("Gagal menjalankan server:", err);
  process.exit(1);
});
