import { NextRequest, NextResponse } from 'next/server';
import { getNominations, addNomination } from '@/lib/google-sheets';

export async function GET() {
  try {
    const nominations = await getNominations();
    return NextResponse.json(nominations);
  } catch (error) {
    console.error('Error fetching nominations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nominations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nomination = await addNomination(body);
    return NextResponse.json(nomination, { status: 201 });
  } catch (error) {
    console.error('Error creating nomination:', error);
    return NextResponse.json(
      { error: 'Failed to create nomination' },
      { status: 500 }
    );
  }
}
