import { NextRequest, NextResponse } from 'next/server';
import { uploadNominationFile, NominationNotFoundError } from '@/lib/nomination-files';
import { withAuth } from '@/lib/api-utils';
import { VALIDATION_LIMITS, FILE_CATEGORY } from '@/lib/constants';
import type { ApiError } from '@/lib/types';
import { logger } from '@/lib/logger';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    // SECURITY: Check Content-Length header before reading the file to prevent DoS
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > VALIDATION_LIMITS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${VALIDATION_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }  // 413 Payload Too Large
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nominationId = formData.get('nominationId') as string;
    const category = formData.get('category') as string;

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!nominationId) {
      return NextResponse.json({ error: 'No nomination ID provided' }, { status: 400 });
    }

    // Double-check file size after reading (defense in depth)
    if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${VALIDATION_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Validate category
    const validCategories = Object.values(FILE_CATEGORY);
    if (category && !validCategories.includes(category as any)) {
      return NextResponse.json(
        { error: 'Invalid file category' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let uploadedFile;
    try {
      uploadedFile = await uploadNominationFile({
        nominationId,
        fileName: file.name,
        mimeType: file.type,
        buffer,
        category,
      });
    } catch (error) {
      if (error instanceof NominationNotFoundError) {
        return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.id,
        name: uploadedFile.name,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        createdTime: uploadedFile.createdTime,
        webViewLink: uploadedFile.webViewLink,
        category,
      },
    });
  } catch (error) {
    const apiError = error as ApiError;
    logger.error('Error uploading file', apiError, { stack: apiError.stack });
    return NextResponse.json(
      { error: `Failed to upload file: ${apiError.message}` },
      { status: 500 }
    );
  }
});
