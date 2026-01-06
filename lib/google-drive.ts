import { google } from 'googleapis';
import { Readable } from 'stream';
import type { ApiError, GoogleDriveFileMetadata, GoogleDriveRequestParams } from './types';
import { logger } from './logger';

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
    const targetFolderId = folderId || FOLDER_ID;
    if (!targetFolderId) {
      throw new Error('No folder ID provided');
    }

    const fileMetadata: GoogleDriveFileMetadata = {
      name: fileName,
      parents: [targetFolderId],
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
  } catch (error) {
    const apiError = error as ApiError;
    logger.error('Error uploading file to Drive', apiError, {
      responseStatus: apiError.response?.status,
      responseData: apiError.response?.data,
    });
    throw apiError;
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
    logger.error('Error getting shared drive ID', error);
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
    logger.debug('Shared Drive ID', { driveId });

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const requestParams: GoogleDriveRequestParams = {
      requestBody: fileMetadata,
      fields: 'id, driveId',
      supportsAllDrives: true,
    };

    // If we have a driveId, include it
    if (driveId) {
      requestParams.driveId = driveId;
    }

    const response = await drive.files.create(requestParams);

    logger.debug('Created folder', { folderId: response.data.id, driveId: response.data.driveId });

    // Check the folder's capabilities
    const folderInfo = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id, name, capabilities, driveId, parents',
      supportsAllDrives: true,
    });

    logger.debug('Folder capabilities', { capabilities: folderInfo.data });

    return response.data.id!;
  } catch (error) {
    const apiError = error as ApiError;
    logger.error('Error creating folder', apiError, {
      responseStatus: apiError.response?.status,
      responseData: apiError.response?.data,
    });
    throw apiError;
  }
}

/**
 * Escape special characters for Google Drive query
 * SECURITY: Escape backslashes first, then single quotes to prevent injection
 */
function escapeDriveQuery(value: string): string {
  // Must escape backslashes FIRST, then single quotes
  // This prevents injection attempts with malicious inputs
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * List files in a folder
 */
export async function listFiles(folderId?: string): Promise<DriveFile[]> {
  try {
    const targetFolder = folderId || FOLDER_ID;
    if (!targetFolder) {
      throw new Error('No folder ID provided');
    }

    // Escape folder ID to prevent injection
    const escapedFolderId = escapeDriveQuery(targetFolder);

    const response = await drive.files.list({
      q: `'${escapedFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
      orderBy: 'createdTime desc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return (response.data.files || []) as DriveFile[];
  } catch (error) {
    logger.error('Error listing files', error);
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
    logger.debug('File found for deletion', { fileId: file.data.id, fileName: file.data.name });

    // For Shared Drive files, we need to use update to trash them
    // Direct delete doesn't work reliably on Shared Drives
    await drive.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
      supportsAllDrives: true,
    });
  } catch (error) {
    const apiError = error as ApiError;
    logger.error('Error deleting file', apiError, {
      code: apiError.code,
      responseData: apiError.response?.data,
    });
    throw new Error(`Failed to delete file: ${apiError.message}`);
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
    logger.error('Error getting file', error);
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
    logger.error('Error making file public', error);
    throw new Error('Failed to make file public');
  }
}
