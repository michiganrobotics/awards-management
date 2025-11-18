import { NextRequest, NextResponse } from 'next/server';
import { getNominations, addNomination } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import { validateCreateNomination } from '@/lib/validation';
import { ZodError } from 'zod';

export const GET = withAuth(async () => {
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
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = validateCreateNomination(body);

    // Create nomination
    const nomination = await addNomination(validatedData);
    return NextResponse.json(nomination, { status: 201 });
  } catch (error) {
    console.error('Error creating nomination:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create nomination' },
      { status: 500 }
    );
  }
});
