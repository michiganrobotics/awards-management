import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, createFolder } from '@/lib/google-drive';
import { getNominations, updateNomination, getAwards } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nominationId = formData.get('nominationId') as string;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!nominationId) {
      return NextResponse.json({ error: 'No nomination ID provided' }, { status: 400 });
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

    // Append category to filename
    const fileExtension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
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
}
