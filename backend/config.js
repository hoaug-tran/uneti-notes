import dotenv from "dotenv";
dotenv.config();
export const PORT = process.env.PORT || 4000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE;
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || "")
  .split(",")
  .filter(Boolean);
