import { google } from 'googleapis';
import { Readable } from 'stream';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

const drive = google.drive({ version: 'v3', auth });

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  folderId?: string
): Promise<DriveFile> {
  try {
    const fileMetadata: any = {
      name: fileName,
      parents: [folderId || FOLDER_ID],
    };

    // Convert buffer to stream
    const stream = Readable.from(buffer);

    const media = {
      mimeType,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
      supportsAllDrives: true,
      supportsTeamDrives: true,
    });

    return response.data as DriveFile;
  } catch (error: any) {
    console.error('Error uploading file to Drive:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

/**
 * Get the shared drive ID from a folder ID
 */
async function getSharedDriveId(folderId: string): Promise<string | undefined> {
  try {
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'driveId',
      supportsAllDrives: true,
    });
    return response.data.driveId || undefined;
  } catch (error) {
    console.error('Error getting shared drive ID:', error);
    return undefined;
  }
}

/**
 * Create a folder in Google Drive (Shared Drive)
 */
export async function createFolder(folderName: string, parentFolderId?: string): Promise<string> {
  try {
    const parentId = parentFolderId || FOLDER_ID!;

    // Get the shared drive ID from the parent folder
    const driveId = await getSharedDriveId(parentId);
    console.log('Shared Drive ID:', driveId);

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const requestParams: any = {
      requestBody: fileMetadata,
      fields: 'id, driveId',
      supportsAllDrives: true,
    };

    // If we have a driveId, include it
    if (driveId) {
      requestParams.driveId = driveId;
    }

    const response = await drive.files.create(requestParams);

    console.log('Created folder:', response.data);

    // Check the folder's capabilities
    const folderInfo = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id, name, capabilities, driveId, parents',
      supportsAllDrives: true,
    });

    console.log('Folder capabilities:', folderInfo.data);

    return response.data.id!;
  } catch (error: any) {
    console.error('Error creating folder:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

/**
 * List files in a folder
 */
export async function listFiles(folderId?: string): Promise<DriveFile[]> {
  try {
    const response = await drive.files.list({
      q: `'${folderId || FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
      orderBy: 'createdTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    // First get the file to find its driveId
    const file = await drive.files.get({
      fileId,
      fields: 'id, name, parents, driveId',
      supportsAllDrives: true,
    });
    console.log('File found:', file.data);

    // For Shared Drive files, we need to use update to trash them
    // Direct delete doesn't work reliably on Shared Drives
    await drive.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
      supportsAllDrives: true,
    });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    console.error('Error details:', error.message, error.code);
    if (error.response?.data) {
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get file metadata
 */
export async function getFile(fileId: string): Promise<DriveFile> {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
    });

    return response.data as DriveFile;
  } catch (error) {
    console.error('Error getting file:', error);
    throw new Error('Failed to get file');
  }
}

/**
 * Make a file publicly readable (optional)
 */
export async function makeFilePublic(fileId: string): Promise<void> {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (error) {
    console.error('Error making file public:', error);
    throw new Error('Failed to make file public');
  }
}
