import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, createFolder } from '@/lib/google-drive';
import { getNominations, updateNomination, getAwards } from '@/lib/google-sheets';
import { withAuth } from '@/lib/api-utils';
import { VALIDATION_LIMITS, FILE_CATEGORY } from '@/lib/constants';

export const POST = withAuth(async (request: NextRequest) => {
  try {
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

    // Validate file size
    if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${VALIDATION_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
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
      console.log('Attempting to create folder:', folderName);
      folderId = await createFolder(folderName);
      console.log('Folder created successfully:', folderId);

      // Update nomination with folder ID
      await updateNomination(nominationId, { driveFolderId: folderId });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedName = file.name.replace(/[/\\]/g, '_');

    // Append category to filename
    const fileExtension = sanitizedName.includes('.') ? sanitizedName.substring(sanitizedName.lastIndexOf('.')) : '';
    const baseName = sanitizedName.includes('.') ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) : sanitizedName;
    const categoryTag = category ? `[${category}]` : '';
    const newFileName = `${baseName}${categoryTag}${fileExtension}`;

    // Upload file to the nomination's folder
    console.log('Uploading file to folder:', folderId);
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
  } catch (error: any) {
    console.error('Error uploading file:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to upload file: ${error.message}` },
      { status: 500 }
    );
  }
});
