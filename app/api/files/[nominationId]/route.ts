import { NextRequest, NextResponse } from 'next/server';
import { listFiles, deleteFile } from '@/lib/google-drive';
import { getNominations } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import type { ApiError } from '@/lib/types';

export const GET = withAuth(async (
  request: NextRequest,
  context?: { params: Promise<{ nominationId: string }> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { nominationId } = await context.params;

    // Get nomination
    const nominations = await getNominations();
    const nomination = nominations.find((n) => n.id === nominationId);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    // If no folder exists yet, return empty list
    if (!nomination.driveFolderId) {
      return NextResponse.json({ files: [] });
    }

    // List files in the nomination's folder
    const files = await listFiles(nomination.driveFolderId);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (
  request: NextRequest,
  context?: { params: Promise<{ nominationId: string }> }
) => {
  try {
    if (!context?.params) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { nominationId } = await context.params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    await deleteFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error deleting file:', apiError);
    // If file not found (404), treat as success since it's already gone
    if (apiError.message?.includes('File not found') || apiError.message?.includes('404')) {
      return NextResponse.json({ success: true, message: 'File already deleted' });
    }
    return NextResponse.json(
      { error: apiError.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
});
