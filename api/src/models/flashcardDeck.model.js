import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
    },
    definition: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const flashcardDeckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deckName: {
      type: String,
      required: true,
      default: "Untitled Deck",
    },
    description: {
      type: String,
      default: "",
    },
    sourceType: {
      type: String,
      enum: ["pdf", "text", "manual"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    cards: [cardSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
flashcardDeckSchema.index({ userId: 1 });
flashcardDeckSchema.index({ createdAt: -1 });

export default mongoose.model("FlashcardDeck", flashcardDeckSchema);