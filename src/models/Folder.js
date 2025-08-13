import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.Folder || mongoose.model("Folder", FolderSchema);
