// src/models/Document.js
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const DocumentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      unique: true,
      default: () => nanoid(21), // random url id
    },
    title: {
      type: String,
      required: true,
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: String,
      required: true,
    },

    sharedWith: [
      {
        user: { type: String, required: true }, // email or userId
        access: {
          type: String,
          enum: ["view", "edit"],
          default: "view",
          required: true,
        },
      },
    ],
    comments: [
      {
        id: String,
        text: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
