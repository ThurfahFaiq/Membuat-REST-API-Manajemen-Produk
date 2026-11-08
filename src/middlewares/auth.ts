import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

interface TokenPayload extends jwt.JwtPayload {
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token autentikasi tidak ditemukan"));
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    next(new HttpError(401, "Token tidak valid atau sudah kedaluwarsa"));
  }
}
