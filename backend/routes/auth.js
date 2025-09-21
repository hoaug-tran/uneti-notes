import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ADMIN_INVITE_CODE, JWT_SECRET } from "../config.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, name, password, invite } = req.body;
    if (invite !== ADMIN_INVITE_CODE)
      return res.status(403).json({ error: "invalid_invite" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "exists" });
    const user = await User.create({ email, name, password, role: "admin" });
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid" });
    const ok = await user.compare(password);
    if (!ok) return res.status(401).json({ error: "invalid" });
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/me", async (req, res) => {
  res.json({ ok: true });
});

export default router;
