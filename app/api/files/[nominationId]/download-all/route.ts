import { NextRequest, NextResponse } from 'next/server';
import { listFiles, downloadFileContent } from '@/lib/google-drive';
import { getNominations } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import archiver from 'archiver';
import { PassThrough } from 'stream';

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

    // If no folder exists yet, return error
    if (!nomination.driveFolderId) {
      return NextResponse.json({ error: 'No files to download' }, { status: 400 });
    }

    // List files in the nomination's folder
    const files = await listFiles(nomination.driveFolderId);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files to download' }, { status: 400 });
    }

    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 5 } // Moderate compression
    });

    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // Download each file and add to archive
    for (const file of files) {
      try {
        const { buffer, name } = await downloadFileContent(file.id);
        archive.append(buffer, { name });
      } catch (error) {
        logger.error('Error downloading file for archive', error, { fileId: file.id, fileName: file.name });
        // Continue with other files even if one fails
      }
    }

    await archive.finalize();

    // Collect the archive into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of passThrough) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    // Create a safe filename for the ZIP
    const safeFileName = `${nomination.candidateName || 'nomination'}-${nomination.nominationYear || 'files'}.zip`
      .replace(/[^a-zA-Z0-9-_.]/g, '_');

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    logger.error('Error creating download archive', error);
    return NextResponse.json(
      { error: 'Failed to create download archive' },
      { status: 500 }
    );
  }
});
