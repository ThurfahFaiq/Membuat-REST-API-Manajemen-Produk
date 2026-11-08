import { Router } from "express";
import { createProduct, getProducts } from "../controllers/product.controller";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getProducts));
router.post("/", authenticate, upload.single("image"), asyncHandler(createProduct));

export default router;
