import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongo";
import Folder from "@/models/Folder";
import User from "@/models/User";

// ================= POST =================
export async function POST(req) {
  try {
    await connectToDB();

    // Get Clerk userId from request
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Ensure User exists in DB
    let user = await User.findOne({ clerkId });
    if (!user) user = await User.create({ clerkId });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ message: "Folder name required" }, { status: 400 });

    const newFolder = await Folder.create({
      name,
      userId: user._id,
    });

    return NextResponse.json(newFolder, { status: 201 });
  } catch (err) {
    console.error("❌ POST /api/folders failed:", err);
    return NextResponse.json({ message: "Failed to create folder" }, { status: 500 });
  }
}

// ================= GET =================
export async function GET(req) {
  try {
    await connectToDB();

    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json([], { status: 200 });

    const user = await User.findOne({ clerkId });
    if (!user) return NextResponse.json([], { status: 200 });

    const folders = await Folder.find({ userId: user._id }).sort({ name: 1 });
    return NextResponse.json(folders, { status: 200 });
  } catch (err) {
    console.error("❌ GET /api/folders failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
