import { NextRequest, NextResponse } from 'next/server';
import { updateNomination } from '@/lib/google-sheets';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const nomination = await updateNomination(id, body);

    if (!nomination) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(nomination);
  } catch (error) {
    console.error('Error updating nomination:', error);
    return NextResponse.json(
      { error: 'Failed to update nomination' },
      { status: 500 }
    );
  }
}
