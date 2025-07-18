import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
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
  sharedWith: {
    type: [String], // list of shared user emails
    default: [],
    //none by default
  },
  comments: [
    {
      id: String,
      text: String,
    },
  ],
});

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
