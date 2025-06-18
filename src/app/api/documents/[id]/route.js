// src/app/api/documents/[id]/route.js
// this route dynamically fetches an existing document by its id
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import templateMap from "@/lib/templateMap";
import { auth, clerkClient } from "@clerk/nextjs/server";
import clerk from "@clerk/clerk-sdk-node";

// Helper function to check access
async function hasAccess(doc, userId) {
  if (!userId) return false;
  if (doc.userId === userId) return true;

  try {
    const user = await clerk.users.getUser(userId);
    const email = user?.emailAddresses?.[0]?.emailAddress;
    return doc.sharedWith.includes(email);
  } catch (err) {
    console.error("Error while checking access:", err);
    return false;
  }
}

export async function GET(req, context) {
  try {
    await connectToDB();

    const { userId } = await auth();

    const { id } = await context.params;
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

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch document", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  try {
    await connectToDB();

    const { params } = context;
    const { userId } = await auth();

    const doc = await Document.findById(params.id);
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    if (!(await hasAccess(doc, userId))) {
      return new Response("Access denied", { status: 403 });
    }

    const body = await req.json();
    const updatedFields = {};

    if (body.title) updatedFields.title = body.title;
    if (body.content) updatedFields.content = body.content;

    const updatedDoc = await Document.findByIdAndUpdate(
      params.id,
      updatedFields,
      { new: true }
    );

    return new Response(JSON.stringify(updatedDoc), {
      status: 200,
    });
  } catch (error) {
    console.error("Update error:", error);
    return new Response("Error updating document", { status: 500 });
  }
}



// DELETE: Delete a document by ID
export async function DELETE(req, { params }) {
  try {
    await connectToDB();
    const { userId } = await auth();

    const doc = await Document.findById(params.id);
    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

      // Only the owner can delete
      if (doc.userId !== userId) {
      return NextResponse.json(
        { message: "Access denied: not the owner" },
        { status: 403 }
      );
    }

    await Document.findByIdAndDelete(params.id);


    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    return new NextResponse("Failed to delete document", { status: 500 });
  }
}
export async function POST(req) {
  try {
    await connectToDB();
    const { userId } = await auth();

    const { title, template, sharedWith } = await req.json();

    const content = templateMap[template]?.content || "";

    const doc = await Document.create({
      title: title || "Untitled",
      content,
      userId,
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Error creating document:", err);
    return NextResponse.json(
      { message: "Failed to create document", error: err.message },
      { status: 500 }
    );
  }
}
