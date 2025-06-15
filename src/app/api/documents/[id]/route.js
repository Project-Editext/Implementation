// src/app/api/documents/[id]/route.js
// this route dynamically fetches an existing document by its id
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";

export async function GET(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params;
    const doc = await Document.findById(id);

    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch document", error: error.message },
      { status: 500 }
    );
  }
}
