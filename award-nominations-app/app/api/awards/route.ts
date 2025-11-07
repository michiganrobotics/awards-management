import { NextRequest, NextResponse } from 'next/server';
import { getAwards, addAward } from '@/lib/google-sheets';

export async function GET() {
  try {
    const awards = await getAwards();
    return NextResponse.json(awards);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch awards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const award = await addAward(body);
    return NextResponse.json(award, { status: 201 });
  } catch (error) {
    console.error('Error creating award:', error);
    return NextResponse.json(
      { error: 'Failed to create award' },
      { status: 500 }
    );
  }
}
