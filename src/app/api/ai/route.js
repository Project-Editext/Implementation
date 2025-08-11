import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req) {
  try {
    const { question, documentContent } = await req.json();
    
    // Convert HTML to plain text
    const plainText = documentContent.replace(/<[^>]*>/g, '');
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create chat completion with improved system prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are an expert document assistant helping users create and improve their documents. 
          The user is working on a document with the following content:
          ${plainText.substring(0, 10000)}
          
          Your role:
          1. Answer questions about the document content
          2. Help format, summarize, or enhance the document
          3. Suggest improvements to the document
          4. Generate content based on the document when asked
          5. Help with document creation tasks like e.g. making lists, tables, or summaries
          
          Guidelines:
          - Be creative and helpful
          - When asked for formats (bullet points, tables, etc.), generate them
          - If the request isn't directly in the document but can be inferred, create it
          - Only say "I couldn't find that" if the request is completely unrelated
          - Be concise but thorough
          - Focus on enhancing the user's document creation experience`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return NextResponse.json({ 
      answer: response.choices[0].message.content 
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { message: "Failed to process request", error: error.message },
      { status: 500 }
    );
  }
}