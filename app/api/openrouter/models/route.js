import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP error! status: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const freeModelArr = data.data.filter(
      (model) =>
        model.pricing.prompt === "0" && model.pricing.completion === "0"
    );
    
    return NextResponse.json(freeModelArr);
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return NextResponse.json({ error: 'Failed to fetch OpenRouter models' }, { status: 500 });
  }
} 