import { auth } from '@clerk/nextjs/server';
import Document from '@/models/Document';
import { connectToDB } from '@/lib/mongo';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const { userId } = auth();
  await connectToDB();
  try {
    // Only return docs owned or shared with user
    const docs = await Document.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ],
    }).limit(50);
    console.log('userId:', userId, 'query:', query);
    console.log('docs found:', docs);
    return NextResponse.json(docs);
  } catch (err) {
    return NextResponse.json(
      { message: 'Failed to search documents', error: err.message },
      { status: 500 }
    );
  }
}
