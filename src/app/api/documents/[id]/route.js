// src/app/api/documents/[id]/route.js
// this route dynamically fetches an existing document by its id
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongo";
import Document from "@/models/Document";
import templateMap from "@/lib/templateMap";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { nanoid } from "nanoid";


// Helper function to check access
async function hasAccess(doc, userId, type = "view") {
  if (!userId) return false;
  if (doc.userId === userId) return true;

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user?.emailAddresses?.[0]?.emailAddress;

    const entry = doc.sharedWith.find(
      (entry) =>
        entry.user === email &&
        (entry.access === type || entry.access === "edit")
    );

    return !!entry;
  } catch (err) {
    console.error("Error while checking access:", err);
    return false;
  }
}

export async function GET(request, context) {
  try {
    await connectToDB();

    const { id } = await context.params;
    const doc = await Document.findOne({ documentId: id });

    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
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
  const { params } = await context;
  try {
    await connectToDB();
    const { userId } = await auth();

    // Extract id from URL path
    //const id = req.url.split('/').pop();

    const doc = await Document.findOne({ documentId: params.id });
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    if (!(await hasAccess(doc, userId, "edit"))) {
      return new Response("Access denied", { status: 403 });
    }

    const body = await req.json();

    const updatedFields = {};
    let shouldUpdate = false;

    if (body.title && body.title !== doc.title) {
      updatedFields.title = body.title;
      shouldUpdate = true;
    }
    if (body.content && body.content !== doc.content) {
      updatedFields.content = body.content;
      shouldUpdate = true;
    }
    if (
      body.comments !== undefined &&
      JSON.stringify(body.comments) !== JSON.stringify(doc.comments)
    ) {
      updatedFields.comments = body.comments;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      const updatedDoc = await Document.findOneAndUpdate(
        { documentId: params.id },
        updatedFields,
        { new: true }
      );
      return new Response(JSON.stringify(updatedDoc), { status: 200 });
    } else {
      return new Response(JSON.stringify(doc), { status: 200 });
    }
  } catch (error) {
    console.error("Update error:", error);
    return new Response("Error updating document", { status: 500 });
  }
}

// DELETE: Delete a document by ID
export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    const deletedDoc = await Document.findOneAndDelete({ documentId: params.id });
    if (!deletedDoc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Error deleting document:", err);
    return new NextResponse("Failed to delete document", { status: 500 });
  }
}
export async function POST(req) {
  try {
    await connectToDB();
    const { userId } = auth();
    const { title, template } = await req.json();

    const content = templateMap[template]?.content || "";

    const doc = await Document.create({
      documentId: nanoid(21),
      title: title || "Untitled",
      content,
      userId,
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
