import { uploadFile, createFolder, DriveFile } from './google-drive';
import { getNominations, updateNomination, getAwards } from './google-sheets';
import { logger } from './logger';

export const GOOGLE_DOC_MIME_TYPE = 'application/vnd.google-apps.document';

export class NominationNotFoundError extends Error {
  constructor(nominationId: string) {
    super(`Nomination not found: ${nominationId}`);
    this.name = 'NominationNotFoundError';
  }
}

/**
 * Sanitize a filename and tag it with its category, e.g. "cv.pdf" -> "cv[cv].pdf"
 */
export function buildNominationFileName(originalName: string, category?: string): string {
  // Sanitize filename to prevent path traversal and malicious characters
  const sanitizedName = originalName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')  // Remove dangerous characters
    .replace(/^\.+/, '')  // Remove leading dots
    .replace(/\.{2,}/g, '.')  // Collapse multiple dots to single dot
    .replace(/^_+|_+$/g, '')  // Remove leading/trailing underscores
    .substring(0, 255);  // Limit filename length

  // Append category to filename
  const fileExtension = sanitizedName.includes('.') ? sanitizedName.substring(sanitizedName.lastIndexOf('.')) : '';
  const baseName = sanitizedName.includes('.') ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) : sanitizedName;
  const categoryTag = category ? `[${category}]` : '';
  return `${baseName}${categoryTag}${fileExtension}`;
}

/**
 * Upload a file into a nomination's Drive folder, creating the folder
 * (and recording its ID on the nomination) on first upload.
 */
export async function uploadNominationFile(params: {
  nominationId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  category?: string;
  /** Import into Drive as this Google file type, e.g. GOOGLE_DOC_MIME_TYPE */
  convertTo?: string;
}): Promise<DriveFile> {
  const { nominationId, fileName, mimeType, buffer, category, convertTo } = params;

  // Get nomination and award
  const [nominations, awards] = await Promise.all([
    getNominations(),
    getAwards(),
  ]);
  const nomination = nominations.find((n) => n.id === nominationId);

  if (!nomination) {
    throw new NominationNotFoundError(nominationId);
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

  const newFileName = buildNominationFileName(fileName, category);

  // Upload file to the nomination's folder
  logger.debug('Uploading file to folder', { folderId, fileName: newFileName });
  return uploadFile(newFileName, mimeType, buffer, folderId, convertTo);
}
