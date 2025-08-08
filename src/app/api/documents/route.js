// src/app/api/documents/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth } from "@clerk/nextjs/server";
import { templates } from "@/lib/templateMap";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDB();

    const { userId } = await auth();
    const user = await clerkClient.users.getUser(userId);
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const query = [{ userId }];
    
    if (email) {
      query.push({ "sharedWith.user": email });
    }

    const docs = await Document.find({ $or: query }).sort({ createdAt: -1 });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("GET /api/documents failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch documents", error: error.stack || error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const { userId } = await auth();
    const body = await req.json();

    const templateKey = body.template?.toLowerCase();
    const templateContent = templates[templateKey]?.content || "";

    const newDoc = await Document.create({
      title: body.title || "Untitled",
      content: templateContent,
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