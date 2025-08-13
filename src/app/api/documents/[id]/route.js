// src/app/api/documents/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongo';
import Document from '@/models/Document';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Helper to check access
async function hasAccess(doc, userId, type = 'view') {
  if (!userId) return false;
  if (doc.userId === userId) return true;

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user?.emailAddresses?.[0]?.emailAddress;
    return doc.sharedWith.some(
      (entry) => entry.user === email && (entry.access === type || entry.access === 'edit')
    );
  } catch (err) {
    console.error('Error while checking access:', err);
    return false;
  }
}

// GET
export async function GET(req, { params }) {
  try {
    await connectToDB();
    const doc = await Document.findById(params.id);
    if (!doc) return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ message: 'Failed to fetch document', error: error.message }, { status: 500 });
  }
}

// PUT
export async function PUT(req, { params }) {
  try {
    await connectToDB();
    const { userId } = await auth();
    const id = params.id;

    const doc = await Document.findById(id);
    if (!doc) return new Response('Document not found', { status: 404 });
    if (!(await hasAccess(doc, userId, 'edit'))) return new Response('Access denied', { status: 403 });

    const body = await req.json();
    const updatedFields = {};
    let shouldUpdate = false;

    if (body.title && body.title !== doc.title) { updatedFields.title = body.title; shouldUpdate = true; }
    if (body.content && body.content !== doc.content) { updatedFields.content = body.content; shouldUpdate = true; }
    if (body.folderId !== undefined && body.folderId !== doc.folderId) { updatedFields.folderId = body.folderId; shouldUpdate = true; }
    if (body.comments !== undefined && JSON.stringify(body.comments) !== JSON.stringify(doc.comments)) { updatedFields.comments = body.comments; shouldUpdate = true; }

    if (shouldUpdate) {
      const updatedDoc = await Document.findByIdAndUpdate(id, updatedFields, { new: true });
      return new Response(JSON.stringify(updatedDoc), { status: 200 });
    } else {
      return new Response(JSON.stringify(doc), { status: 200 });
    }
  } catch (error) {
    console.error('Update error:', error);
    return new Response('Error updating document', { status: 500 });
  }
}

// DELETE
export async function DELETE(req, { params }) {
  try {
    await connectToDB();
    const deletedDoc = await Document.findByIdAndDelete(params.id);
    if (!deletedDoc) return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    return new NextResponse('Failed to delete document', { status: 500 });
  }
}
