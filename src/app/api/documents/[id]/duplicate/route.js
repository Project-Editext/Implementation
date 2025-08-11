import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";


export async function POST(req, context) {
  const { params } = await context;
  try {
    await connectToDB();

    // Get current user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const originalDoc = await Document.findOne({ documentId: params.id });
    if (!originalDoc) {
      return NextResponse.json({ message: "Original document not found" }, { status: 404 });
    }

    // Create new document copy
    const copyDoc = new Document({
      documentId: nanoid(21),
      title: `Copy of ${originalDoc.title}`,
      content: originalDoc.content,
      userId, // current user is new owner
      sharedWith: [],
      comments: [],

    });

    const savedCopy = await copyDoc.save();

    return NextResponse.json({ newDocumentId: savedCopy.documentId }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating document:", error);
    return NextResponse.json({ message: "Failed to duplicate", error: error.message }, { status: 500 });
  }
}