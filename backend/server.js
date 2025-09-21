import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { CORS_ORIGIN, MONGO_URI, PORT } from "./config.js";
import authRoutes from "./routes/auth.js";
import noteRoutes from "./routes/notes.js";

const app = express();
app.use(
  cors({
    origin: (o, cb) =>
      cb(null, !CORS_ORIGIN.length || CORS_ORIGIN.includes(o) || !o),
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/notes", noteRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log("api:" + PORT));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
