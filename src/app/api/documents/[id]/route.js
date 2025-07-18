// src/app/api/documents/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import { auth, clerkClient } from "@clerk/nextjs/server";
import clerk from "@clerk/clerk-sdk-node";

// Helper function to check access
async function hasAccess(doc, userId, type = 'view') {
  if (!userId) return false;
  if (doc.userId === userId) return true;

  try {
    const user = await clerk.users.getUser(userId);
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const entry = doc.sharedWith.find(
      (entry) => entry.user === email && (entry.access === type || entry.access === 'edit')
    );

    return !!entry;
  } catch (err) {
    console.error("Error while checking access:", err);
    return false;
  }
}

export async function GET(request) {
  try {
    await connectToDB();
    const { userId } = await auth();
    
    // Extract id from URL path
    const id = request.url.split('/').pop();
    
    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    if (!(await hasAccess(doc, userId))) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Return the document in the expected structure
    return NextResponse.json({
      _id: doc._id,
      title: doc.title,
      content: doc.content,
      userId: doc.userId,
      sharedWith: doc.sharedWith,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch document", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const { userId } = await auth();
    
    // Extract id from URL path
    const id = request.url.split('/').pop();
    
    const doc = await Document.findById(id);
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    if (!(await hasAccess(doc, userId, 'edit'))) {
      return new Response("Access denied", { status: 403 });
    }

    const body = await request.json();
    const updatedFields = {};

    if (body.title) updatedFields.title = body.title;
    if (body.content) updatedFields.content = body.content;

    const updatedDoc = await Document.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true }
    );

    // Return the updated document in the expected structure
    return new Response(JSON.stringify({
      _id: updatedDoc._id,
      title: updatedDoc.title,
      content: updatedDoc.content,
      userId: updatedDoc.userId,
      sharedWith: updatedDoc.sharedWith,
      createdAt: updatedDoc.createdAt,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Update error:", error);
    return new Response("Error updating document", { status: 500 });
  }
}

// DELETE: Delete a document by ID
export async function DELETE(request) {
  try {
    await connectToDB();
    const { userId } = await auth();
    
    // Extract id from URL path
    const id = request.url.split('/').pop();
    
    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    if (doc.userId !== userId) {
      return NextResponse.json(
        { message: "Access denied: not the owner" },
        { status: 403 }
      );
    }

    await Document.findByIdAndDelete(id);
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    return NextResponse.json(
      { message: "Failed to delete document", error: err.message },
      { status: 500 }
    );
  }
}