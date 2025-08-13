import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { templates } from "@/lib/templateMap";
import { v4 as uuidv4 } from "uuid";


export const dynamic = "force-dynamic";

// ADDED: Helper function to determine the sort query based on the URL parameter
const getSortObject = (option) => {
  switch (option) {
    case 'title_asc':
      return { title: 1 };
    case 'title_desc':
      return { title: -1 };
    case 'created_asc':
      return { createdAt: 1 };
    case 'created_desc':
      return { createdAt: -1 };
    case 'modified_asc':
      return { updatedAt: 1 };
    case 'modified_desc':
    default:
      return { updatedAt: -1 };
  }
};

// MODIFIED: GET function now accepts 'req' to read URL parameters
export async function GET(req) {
  try {
    await connectToDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ADDED: Read the 'sort' parameter from the request URL
    const sortOption = req.nextUrl.searchParams.get('sort');

    // ADDED: Convert the parameter into a database-friendly sort object
    const sortQuery = getSortObject(sortOption);

    // MODIFIED: The hardcoded sort is replaced with the dynamic sortQuery
    const docs = await Document.find({
      $or: [
        { userId },
        { "sharedWith.user": userId }
      ]
    }).sort(sortQuery);

    return NextResponse.json(docs);
  } catch (error) {
    console.error("❌ GET /api/documents failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch documents", error: error.stack || error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new document with optional template (This function is unchanged)
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
      userId,
      documentId: uuidv4(), // ✅ generate unique ID
      folderId: body.folderId || null,
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
