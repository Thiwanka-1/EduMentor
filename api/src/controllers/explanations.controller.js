import Explanation from "../models/Explanation.js";

// GET /api/mveg/explanations
export async function listExplanations(req, res) {
  try {
    const items = await Explanation.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .select(
        "_id question mode title answer views createdAt strict module complexity",
      );

    res.json(items);
  } catch (err) {
    console.error("List explanations error:", err);
    res.status(500).json({ error: "Failed to load explanations" });
  }
}

// GET /api/mveg/explanations/:id
export async function getExplanation(req, res) {
  try {
    const item = await Explanation.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select(
      "_id question mode title answer views createdAt strict module complexity",
    );

    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("Get explanation error:", err);
    res.status(500).json({ error: "Failed to load explanation" });
  }
}

// DELETE /api/mveg/explanations/:id
export async function deleteExplanation(req, res) {
  try {
    const deleted = await Explanation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Delete explanation error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
}

// PATCH /api/mveg/explanations/:id/title
export async function renameExplanation(req, res) {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title required" });
    }

    const updated = await Explanation.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
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
