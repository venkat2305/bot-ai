import { NextResponse } from 'next/server';

// Static list of supported Gemini models
const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    object: 'model',
    created: 1735689600,
    owned_by: 'google',
    permission: [],
    root: 'gemini-2.5-flash',
    parent: null,
  },
  {
    id: 'gemini-1.5-pro',
    object: 'model',
    created: 1715385600,
    owned_by: 'google',
    permission: [],
    root: 'gemini-1.5-pro',
    parent: null,
  },
  {
    id: 'gemini-1.5-flash',
    object: 'model',
    created: 1715385600,
    owned_by: 'google',
    permission: [],
    root: 'gemini-1.5-flash',
    parent: null,
  },
];

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    // Return the static list of supported Gemini models
    return NextResponse.json(GEMINI_MODELS);
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return NextResponse.json({ error: 'Failed to fetch Gemini models' }, { status: 500 });
  }
} 