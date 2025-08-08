import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
//import { Clerk } from "@clerk/clerk-sdk-node";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";

//const clerkClient = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(request) {
  try {
    await connectToDB();

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();

    const urlSegments = new URL(request.url).pathname.split('/');
    const id = urlSegments[urlSegments.length - 2];
    const { email, access = 'view' } = await request.json();

    if (!['view', 'edit'].includes(access)) {
      return NextResponse.json({ message: "Invalid access level" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const doc = await Document.findOne({ documentId: id });

    if (!doc) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    const isOwner = doc.userId === userId;
    const collaborator = doc.sharedWith.find(entry =>
      entry.user.toLowerCase() === userEmail && entry.access === 'edit'
    );

    if (!isOwner && !collaborator) {
      return NextResponse.json({
        message: "Only owner or editors can share document"
      }, { status: 403 });
    }

    const existingIndex = doc.sharedWith.findIndex(entry =>
      entry.user.toLowerCase() === normalizedEmail
    );

    if (existingIndex !== -1) {
      doc.sharedWith[existingIndex].access = access;
    } else {
      doc.sharedWith.push({ user: normalizedEmail, access });
    }

    await doc.save();

    return NextResponse.json({ message: "Document shared successfully" });

  } catch (error) {
    console.error("Error sharing document:", error);
    return NextResponse.json({ message: "Failed to share document", error: error.message }, { status: 500 });
  }
}
