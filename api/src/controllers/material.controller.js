import path from "path";
import fs from "fs";
import { extractFromMultipleFiles } from "../utils/fileParser.js";
import Material from "../models/material.model.js";

/**
 * POST /api/materials/upload
 * Accept multiple files, extract text, save to MongoDB, return materialId.
 */
export async function uploadMaterial(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files uploaded. Please attach at least one file.",
      });
    }

    console.log(`\n Received ${req.files.length} file(s):`);
    req.files.forEach((f) =>
      console.log(`   • ${f.originalname} (${(f.size / 1024).toFixed(1)} KB)`)
    );

    const firstFile = req.files[0];

    const existing = await Material.findOne({
      "files.originalname": firstFile.originalname,
    })
      .sort({ uploadedAt: -1 })
      .lean();

    if (existing) {
      console.log(
        `    Material already exists for "${firstFile.originalname}" — reusing ${existing._id}`
      );

      // Clean up uploaded temp files since we won't use them
      req.files.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (_) {}
      });

      return res.json({
        success: true,
        materialId: existing._id,
        reused: true,
        files: existing.files.map((f) => ({
          name: f.originalname,
          size: f.size,
          type: f.mimetype,
        })),
        textLength: existing.textContent.length,
        preview: existing.textContent.slice(0, 300) + "…",
      });
    }

    // Extract text from all files
    const extractedText = await extractFromMultipleFiles(req.files);

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        success: false,
        error:
          "Could not extract sufficient text from the uploaded files. Please check the file content.",
      });
    }

    // Determine title from first file name
    const title =
      req.files[0].originalname.replace(/\.[^/.]+$/, "") || "Untitled Material";

    // Determine file type
    const mimeTypes = [...new Set(req.files.map((f) => f.mimetype))];
    const fileType =
      mimeTypes.length === 1 ? mimeTypes[0].split("/").pop() : "mixed";

    // Save to MongoDB Atlas
    const material = new Material({
      userId: req.user?._id || null,
      title,
      files: req.files.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      })),
      textContent: extractedText,
      fileType,
    });

    await material.save();

    console.log(`   Material saved to MongoDB: ${material._id}`);
    console.log(
      `   Extracted text: ${extractedText.length.toLocaleString()} chars`
    );

    // Clean up uploaded files from disk (text already in MongoDB)
    req.files.forEach((f) => {
      try {
        fs.unlinkSync(f.path);
      } catch (_) {}
    });

    res.json({
      success: true,
      materialId: material._id,
      reused: false,
      files: req.files.map((f) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
      })),
      textLength: extractedText.length,
      preview: extractedText.slice(0, 300) + "…",
    });
  } catch (err) {
    // Clean up on error
    if (req.files) {
      req.files.forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (_) {}
      });
    }
    next(err);
  }
}

/**
 * GET /api/materials
 * List all stored materials (metadata only, no full text).
 */
export async function listAllMaterials(_req, res, next) {
  try {
    const materials = await Material.find()
      .select("-textContent") // Exclude large text field
      .sort({ uploadedAt: -1 })
      .lean();

    res.json({
      success: true,
      materials: materials.map((m) => ({
        id: m._id,
        title: m.title,
        files: m.files,
        fileType: m.fileType,
        uploadedAt: m.uploadedAt,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/materials/:id
 * Retrieve a specific material.
 */
export async function getMaterialById(req, res, next) {
  try {
    const material = await Material.findById(req.params.id).lean();

    if (!material) {
      return res
        .status(404)
        .json({ success: false, error: "Material not found" });
    }

    res.json({
      success: true,
      material: {
        id: material._id,
        title: material.title,
        files: material.files,
        fileType: material.fileType,
        textLength: material.textContent.length,
        preview: material.textContent.slice(0, 500) + "…",
        uploadedAt: material.uploadedAt,
        createdAt: material.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/materials/:id
 */
export async function removeMaterial(req, res, next) {
  try {
    const result = await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: !!result });
  } catch (err) {
    next(err);
  }
}