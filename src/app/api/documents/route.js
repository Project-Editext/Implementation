// src/app/api/documents/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { templates } from "@/lib/templateMap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDB();
    const { userId } = auth();
    const docs = await Document.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch documents", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const { userId } = auth();
    const body = await req.json();

    // temp

    const templateKey = body.template?.toLowerCase();
    const templateContent = templates[templateKey]?.content || "";

    const newDoc = await Document.create({
      title: body.title || "Untitled",
      content: templateContent,
      createdAt: new Date(),
      userId,
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("❌ Failed to create document:", error);
    return NextResponse.json(
      { message: "Failed to create document", error: error.message },
      { status: 500 }
    );
  }
}
