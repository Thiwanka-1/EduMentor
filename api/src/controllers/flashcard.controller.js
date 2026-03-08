import path from "path";
import FlashcardDeck from "../models/flashcardDeck.model.js";
import { generate } from "../services/ollama.service.js";
import { extractText } from "../utils/fileParser.js";

const MAX_TEXT_CHARS = 1500;

/**
 * Build the flashcard generation prompt for Ollama.
 * @param {string} textContent – study material text
 * @returns {string} prompt
 */
function buildFlashcardPrompt(textContent) {
  return `Generate flashcards from the following study notes.

Each flashcard must include:
- Term
- Definition

Return JSON only.

Format:
[
  {
    "term": "",
    "definition": ""
  }
]

Limit output to 10 flashcards.

Text:
${textContent}`;
}

/**
 * Parse flashcard JSON from raw Ollama output.
 * Similar to jsonSanitizer but tailored for flashcard arrays.
 * @param {string} raw – raw text from Ollama
 * @returns {Array<{term: string, definition: string}>}
 */
function parseFlashcardJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty response from AI model");
  }

  let cleaned = raw.trim();

  console.log("   Raw flashcard response preview:", cleaned.slice(0, 200));

  // Strip markdown fences
  cleaned = cleaned
    .replace(/^```(?:json)?[\r\n]*/i, "")
    .replace(/[\r\n]*```\s*$/i, "")
    .trim();

  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");

  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    let candidate = cleaned.slice(arrStart, arrEnd + 1);
    candidate = candidate.replace(/,(\s*[\]}])/g, "$1");

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        validateFlashcards(parsed);
        console.log("   Flashcard JSON parsed successfully (pass 1 — array)");
        return parsed;
      }
    } catch (e1) {
      console.warn("    Flashcard parse pass 1 failed:", e1.message);
    }
  }

  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");

  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    let candidate = cleaned.slice(objStart, objEnd + 1);
    candidate = candidate.replace(/,(\s*[\]}])/g, "$1");

    try {
      const parsed = JSON.parse(candidate);
      const cards = parsed.flashcards || parsed.cards || parsed;
      if (Array.isArray(cards) && cards.length > 0) {
        validateFlashcards(cards);
        console.log(
          "   Flashcard JSON parsed successfully (pass 2 — object wrapper)",
        );
        return cards;
      }
    } catch (e2) {
      console.warn("    Flashcard parse pass 2 failed:", e2.message);
    }
  }

  try {
    const objectBlocks = [];
    const objRegex = /\{(?:[^{}]|\{[^{}]*\})*\}/g;
    let match;

    while ((match = objRegex.exec(cleaned)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj.term && obj.definition) {
          objectBlocks.push(obj);
        }
      } catch (_) {
        // skip malformed blocks
      }
    }

    if (objectBlocks.length > 0) {
      console.log(
        `   Flashcard JSON rescued via object extraction (pass 3): ${objectBlocks.length} card(s)`,
      );
      return objectBlocks;
    }
  } catch (e3) {
    console.warn("    Flashcard parse pass 3 failed:", e3.message);
  }

  console.error(" All flashcard JSON parse attempts failed.");
  console.error("   Raw output (first 800 chars):\n", raw.slice(0, 800));

  throw new Error(
    "The AI model returned an unexpected format. Please click Generate to try again.",
  );
}

/**
 * Validate that parsed cards have required fields.
 */
function validateFlashcards(cards) {
  for (const card of cards) {
    if (!card.term || !card.definition) {
      throw new Error("Flashcard missing required fields (term / definition)");
    }
  }
}

// POST /api/flashcards/generate
// Body (text mode):  { text, deckName? }
// Body (PDF mode):   multipart file upload + deckName?
export async function generateFlashcards(req, res, next) {
  try {
    let textContent = "";
    let sourceType = "text";

    if (req.file) {
      // PDF / file upload via multer (single file)
      console.log(`\n Generating flashcards from file: ${req.file.originalname}`);
      textContent = await extractText(req.file.path);
      sourceType = "pdf";
    } else if (req.body.text) {
      // Pasted text
      console.log(`\n Generating flashcards from pasted text`);
      textContent = req.body.text;
      sourceType = "text";
    } else {
      return res.status(400).json({
        success: false,
        error:
          "No input provided. Upload a PDF file or paste text to generate flashcards.",
      });
    }

    textContent = textContent.trim();

    if (!textContent || textContent.length < 20) {
      return res.status(400).json({
        success: false,
        error:
          "Extracted text is too short (minimum 20 characters). Please upload a different file or paste more text.",
      });
    }

    if (textContent.length > MAX_TEXT_CHARS) {
      textContent = textContent.slice(0, MAX_TEXT_CHARS);
      console.log(`    Text truncated to ${MAX_TEXT_CHARS} chars`);
    }

    console.log(`   Text length: ${textContent.length.toLocaleString()} chars`);

    const prompt = buildFlashcardPrompt(textContent);
    const rawResponse = await generate(prompt);

    const cards = parseFlashcardJSON(rawResponse);

    // Clean up cards
    const cleanedCards = cards.slice(0, 10).map((c) => ({
      term: c.term.trim(),
      definition: c.definition.trim(),
    }));

    const deckName = req.body.deckName || "Untitled Deck";
    const description = req.body.description || "";
    const tags = req.body.tags
      ? Array.isArray(req.body.tags)
        ? req.body.tags
        : [req.body.tags]
      : [];

    const deck = new FlashcardDeck({
      userId: req.user._id,
      deckName,
      description,
      sourceType,
      tags,
      cards: cleanedCards,
    });

    await deck.save();

    console.log(
      `   Flashcard deck saved: ${deck._id} (${cleanedCards.length} cards)`
    );

    res.json({
      success: true,
      deckId: deck._id,
      deckName: deck.deckName,
      sourceType: deck.sourceType,
      cards: cleanedCards,
      cardCount: cleanedCards.length,
      createdAt: deck.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/flashcards
// List all decks for the authenticated user
export async function listDecks(req, res, next) {
  try {
    const decks = await FlashcardDeck.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          deckName: 1,
          description: 1,
          sourceType: 1,
          tags: 1,
          cardCount: { $size: "$cards" },
          createdAt: 1,
        },
      },
    ]);

    res.json({
      success: true,
      decks: decks.map((d) => ({
        id: d._id,
        deckName: d.deckName,
        description: d.description,
        sourceType: d.sourceType,
        tags: d.tags,
        cardCount: d.cardCount,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/flashcards/:deckId
// Return full deck with cards for study mode
export async function getDeckById(req, res, next) {
  try {
    const deck = await FlashcardDeck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    }).lean();

    if (!deck) {
      return res.status(404).json({ success: false, error: "Deck not found" });
    }

    res.json({
      success: true,
      deck: {
        id: deck._id,
        deckName: deck.deckName,
        description: deck.description,
        sourceType: deck.sourceType,
        tags: deck.tags,
        cards: deck.cards,
        cardCount: deck.cards.length,
        createdAt: deck.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/flashcards/:deckId
// Update deck name, description, tags, or cards
export async function updateDeck(req, res, next) {
  try {
    const { deckName, description, tags, cards } = req.body;

    const deck = await FlashcardDeck.findOne({
      _id: req.params.deckId,
      userId: req.user._id,
    });

    if (!deck) {
      return res.status(404).json({ success: false, error: "Deck not found" });
    }

    if (deckName !== undefined) deck.deckName = deckName;
    if (description !== undefined) deck.description = description;
    if (tags !== undefined) deck.tags = tags;
    if (cards !== undefined) deck.cards = cards;

    await deck.save();

    res.json({
      success: true,
      deck: {
        id: deck._id,
        deckName: deck.deckName,
        description: deck.description,
        sourceType: deck.sourceType,
        tags: deck.tags,
        cards: deck.cards,
        cardCount: deck.cards.length,
        createdAt: deck.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/flashcards/:deckId
// Delete a deck
export async function deleteDeck(req, res, next) {
  try {
    const deck = await FlashcardDeck.findOneAndDelete({
      _id: req.params.deckId,
      userId: req.user._id,
    });

    if (!deck) {
      return res.status(404).json({ success: false, error: "Deck not found" });
    }

    res.json({ success: true, message: "Deck deleted successfully" });
  } catch (err) {
    next(err);
  }
}