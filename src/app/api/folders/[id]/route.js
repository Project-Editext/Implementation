import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Folder from "@/models/Folder";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
export async function DELETE(req, { params }) {
  try {
    await connectToDB();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const folderId = params.id;
    const folder = await Folder.findById(folderId);
    if (!folder) return NextResponse.json({ message: "Folder not found" }, { status: 404 });

    // Move all documents in this folder back to dashboard
    await Document.updateMany({ folderId }, { $set: { folderId: null } });

    // Delete the folder
    await Folder.findByIdAndDelete(folderId);

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (err) {
    console.error("Failed to delete folder:", err);
    return NextResponse.json({ message: "Failed to delete folder", error: err.message }, { status: 500 });
  }
}
