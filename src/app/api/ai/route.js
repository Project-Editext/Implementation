// src/app/api/ai/route.js
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function POST(req) {
  try {
    const { question, documentContent } = await req.json();
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create chat completion with document context
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are an HTML document generator. Follow these rules STRICTLY:
1. You are working with this document content:
${documentContent.replace(/<[^>]*>/g, ' ').substring(0, 10000)}

2. Output ONLY raw HTML-formatted content without explanations
3. For tables:
   - Use the simplest possible structure with NO unnecessary elements
   - NEVER include <colgroup>, <col>, or style attributes
   - NEVER include empty rows or columns
   - Structure MUST be:
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row 1 Cell 1</td>
              <td>Row 1 Cell 2</td>
            </tr>
          </tbody>
        </table>
   - ALWAYS put headers in <thead> and data in <tbody>
   - NEVER use rowspan or colspan unless absolutely required
   - NEVER include <p> tags - only plain text inside cells
   - NEVER include <br> tags or trailing breaks
   - NEVER include empty cells
   - Each row MUST have exactly the same number of cells as the header row
   - NEVER add any spacing between cells
4. If you are asked to create a table, output ONLY the table HTML without any surrounding text
5. For non-table content, use appropriate HTML tags (p, h1-h6, ul, ol, li, strong, em)
6. NEVER include any attributes (class, style, etc.) in any HTML tags
7. If you cannot generate the requested content, return an empty string`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.1,  // Very low temperature for strict output
      max_tokens: 1000
    });

    const htmlContent = response.choices[0].message.content;
    
    return NextResponse.json({ 
      htmlContent,
      message: "Your request has been added to the document"
    });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { message: "Failed to process request", error: error.message },
      { status: 500 }
    );
  }
}