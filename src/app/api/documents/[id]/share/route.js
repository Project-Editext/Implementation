// src/app/api/documents/[id]/share/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";

export async function POST(request) {
  try {
    await connectToDB();
    const { userId } = await auth();
    const id = request.url.split('/').slice(-2, -1)[0];
    const { email } = await request.json();

    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    if (doc.userId !== userId) {
      return NextResponse.json({ message: "Only the owner can share the document" }, { status: 403 });
    }

    if (!doc.sharedWith.includes(email)) {
      doc.sharedWith.push(email);
      await doc.save();
    }

    return NextResponse.json({ message: "Document shared successfully" });
  } catch (err) {
    console.error("Error sharing document:", err);
    return NextResponse.json(
      { message: "Failed to share document", error: err.message },
      { status: 500 }
    );
  }
}