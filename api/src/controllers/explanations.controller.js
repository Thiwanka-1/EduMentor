import Explanation from "../models/Explanation.js";

// GET /api/explanations
export async function listExplanations(req, res) {
  try {
    const items = await Explanation.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .select("_id question mode title answer views createdAt strict");

    res.json(items);
  } catch (err) {
    console.error("List explanations error:", err);
    res.status(500).json({ error: "Failed to load explanations" });
  }
}

// GET /api/explanations/:id
export async function getExplanation(req, res) {
  try {
    const item = await Explanation.findById(req.params.id).select(
      "_id question mode title answer views createdAt strict",
    );

    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("Get explanation error:", err);
    res.status(500).json({ error: "Failed to load explanation" });
  }
}

// DELETE /api/explanations/:id
export async function deleteExplanation(req, res) {
  try {
    const deleted = await Explanation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete explanation error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
}

// PATCH /api/explanations/:id/title
export async function renameExplanation(req, res) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title required" });
    }

    const updated = await Explanation.findByIdAndUpdate(
      req.params.id,
      { title: title.trim() },
      { new: true },
    ).select("_id title");

    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ error: "Rename failed" });
  }
}
