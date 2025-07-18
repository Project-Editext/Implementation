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

  sharedWith: [
    {
      user: { type: String, required: true }, // email or userId
      access: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view',
        required: true,
      },
    }
  ],
  comments: [
    {
      id: String,
      text: String,
    },
  ],
});

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
