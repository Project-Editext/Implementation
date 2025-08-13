import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String },
  name: { type: String },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
