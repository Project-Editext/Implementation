import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { templates } from "@/lib/templateMap";

export const dynamic = "force-dynamic";

// GET: Fetch documents owned or shared with the user
export async function GET() {
  try {
    await connectToDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const docs = await Document.find({
      $or: [
        { userId },
        { "sharedWith.user": userId }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("❌ GET /api/documents failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch documents", error: error.stack || error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new document with optional template
export async function POST(req) {
  try {
    await connectToDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const templateKey = body.template?.toLowerCase();
    const templateContent = templates[templateKey]?.content || "";

    const newDoc = await Document.create({
      title: body.title || "Untitled",
      content: templateContent,
      createdAt: new Date(),
      userId
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("❌ POST /api/documents failed:", error);
    return NextResponse.json(
      { message: "Failed to create document", error: error.message },
      { status: 500 }
    );
  }
}
