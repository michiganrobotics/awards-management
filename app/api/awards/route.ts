import { NextRequest, NextResponse } from 'next/server';
import { getAwards, addAward } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import { validateAward } from '@/lib/validation';
import { ZodError } from 'zod';

export const GET = withAuth(async () => {
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
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = validateAward(body);

    // Create award
    const award = await addAward(validatedData);
    return NextResponse.json(award, { status: 201 });
  } catch (error) {
    console.error('Error creating award:', error);

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
      { error: 'Failed to create award' },
      { status: 500 }
    );
  }
});
