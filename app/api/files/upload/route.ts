import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, createFolder } from '@/lib/google-drive';
import { getNominations, updateNomination, getAwards } from '@/lib/google-sheets';
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

    // Get nomination and award
    const [nominations, awards] = await Promise.all([
      getNominations(),
      getAwards(),
    ]);
    const nomination = nominations.find((n) => n.id === nominationId);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    const award = awards.find((a) => a.id === nomination.awardId);
    const awardName = award?.awardOrPrize || 'Unknown Award';

    // Create folder for nomination if it doesn't exist
    let folderId = nomination.driveFolderId;
    if (!folderId) {
      const folderName = `${nomination.candidateName} - ${nomination.nominationYear} - ${awardName}`;
      logger.debug('Attempting to create folder', { folderName });
      folderId = await createFolder(folderName);
      logger.debug('Folder created successfully', { folderId });

      // Update nomination with folder ID
      await updateNomination(nominationId, { driveFolderId: folderId });
    }

    // Sanitize filename to prevent path traversal and malicious characters
    const sanitizedName = file.name
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')  // Remove dangerous characters
      .replace(/^\.+/, '')  // Remove leading dots
      .replace(/\.{2,}/g, '.')  // Collapse multiple dots to single dot
      .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
      .substring(0, 255);  // Limit filename length

    // Append category to filename
    const fileExtension = sanitizedName.includes('.') ? sanitizedName.substring(sanitizedName.lastIndexOf('.')) : '';
    const baseName = sanitizedName.includes('.') ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) : sanitizedName;
    const categoryTag = category ? `[${category}]` : '';
    const newFileName = `${baseName}${categoryTag}${fileExtension}`;

    // Upload file to the nomination's folder
    logger.debug('Uploading file to folder', { folderId, fileName: newFileName });
    const uploadedFile = await uploadFile(newFileName, file.type, buffer, folderId);

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
