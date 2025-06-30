import OpenAI from "openai";
import { NextResponse } from 'next/server';

export async function GET() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
    console.log("in groq route")
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
  }

  try {
    const groq = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const response = await groq.models.list();
    console.log(response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    return NextResponse.json({ error: 'Failed to fetch Groq models' }, { status: 500 });
  }
} 