import { NextRequest, NextResponse } from 'next/server';
import { updateNomination } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import { validateNominationUpdate } from '@/lib/validation';
import { ZodError } from 'zod';

export const PATCH = withAuth(async (
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    if (!context?.params) {
      console.error('PATCH: Missing context or params');
      return NextResponse.json({ error: 'Invalid request - missing params' }, { status: 400 });
    }
    const { id } = await context.params;
    console.log('PATCH: Updating nomination with ID:', id);
    const body = await request.json();

    // Validate input
    const validatedData = validateNominationUpdate(body);

    // Update nomination
    const nomination = await updateNomination(id, validatedData);

    if (!nomination) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(nomination);
  } catch (error) {
    console.error('Error updating nomination:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update nomination' },
      { status: 500 }
    );
  }
});
