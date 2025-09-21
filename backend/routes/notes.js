import express from "express";
import slugify from "slugify";
import Note from "../models/Note.js";
import User from "../models/User.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { q, tag, lang, limit = 50 } = req.query;
  const f = {};
  if (q)
    f.$or = [
      { title: new RegExp(q, "i") },
      { content: new RegExp(q, "i") },
      { tags: new RegExp(q, "i") },
    ];
  if (tag) f.tags = tag;
  if (lang) f.language = lang;
  const items = await Note.find(f).sort({ updatedAt: -1 }).limit(Number(limit));
  res.json(items);
});

router.get("/feed", async (req, res) => {
  const items = await Note.find()
    .sort({ updatedAt: -1 })
    .limit(20)
    .select("title slug updatedAt tags language");
  res.json(items);
});

router.get("/:slug", async (req, res) => {
  const item = await Note.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ error: "not_found" });
  res.json(item);
});

router.post("/", auth, adminOnly, async (req, res) => {
  const { title, content, language, tags } = req.body;
  const base = slugify(title, { lower: true, strict: true });
  let s = base;
  let i = 1;
  while (await Note.findOne({ slug: s })) s = `${base}-${i++}`;
  const item = await Note.create({
    title,
    slug: s,
    content,
    language,
    tags,
    author: req.user.id,
  });
  res.status(201).json(item);
});

router.put("/:slug", auth, adminOnly, async (req, res) => {
  const { title, content, language, tags } = req.body;
  const item = await Note.findOne({ slug: req.params.slug });
  if (!item) return res.status(404).json({ error: "not_found" });
  if (title) item.title = title;
  if (content) item.content = content;
  if (language) item.language = language;
  if (tags) item.tags = tags;
  await item.save();
  res.json(item);
});

router.delete("/:slug", auth, adminOnly, async (req, res) => {
  const item = await Note.findOneAndDelete({ slug: req.params.slug });
  if (!item) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});

router.post("/:slug/follow", auth, async (req, res) => {
  const note = await Note.findOne({ slug: req.params.slug });
  if (!note) return res.status(404).json({ error: "not_found" });
  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { watchlist: note._id } }
  );
  res.json({ ok: true });
});

router.post("/:slug/unfollow", auth, async (req, res) => {
  const note = await Note.findOne({ slug: req.params.slug });
  if (!note) return res.status(404).json({ error: "not_found" });
  await User.updateOne(
    { _id: req.user.id },
    { $pull: { watchlist: note._id } }
  );
  res.json({ ok: true });
});

router.get("/me/watchlist/list", auth, async (req, res) => {
  const u = await User.findById(req.user.id).populate({
    path: "watchlist",
    options: { sort: { updatedAt: -1 } },
  });
  res.json(u.watchlist || []);
});

export default router;
