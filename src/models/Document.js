import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const DocumentSchema = new mongoose.Schema(
  {
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
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    documentId: {
      type: String,
      unique: true,
      required: true,
      default: () => uuidv4(), // ✅ automatically generate unique ID
    },
    sharedWith: [
      {
        user: { type: String, required: true },
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
