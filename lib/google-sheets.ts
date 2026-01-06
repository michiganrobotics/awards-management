import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Award, Nomination } from './types';
import { safeJsonParse } from './api-utils';
import { AWARD_COLUMNS, NOMINATION_COLUMNS } from './constants';
import { randomUUID } from 'crypto';
import { logger } from './logger';

// Initialize auth
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Sheet creation lock to prevent race conditions
interface SheetLock {
  promise: Promise<any>;
  timestamp: number;
}

const sheetCreationLocks = new Map<string, SheetLock>();

// Clean up stale locks (older than 5 minutes)
const LOCK_TIMEOUT = 5 * 60 * 1000;
function cleanupStaleLocks() {
  const now = Date.now();
  for (const [sheetName, lock] of sheetCreationLocks.entries()) {
    if (now - lock.timestamp > LOCK_TIMEOUT) {
      sheetCreationLocks.delete(sheetName);
    }
  }
}

function getAuthClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Google Sheets credentials');
  }

  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
}

export async function getSpreadsheet() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable');
  }

  const doc = new GoogleSpreadsheet(spreadsheetId, getAuthClient());
  await doc.loadInfo();
  return doc;
}

/**
 * Ensure a sheet exists, creating it if necessary
 * Uses locking to prevent race conditions
 */
async function ensureSheet(doc: GoogleSpreadsheet, sheetName: string, headerValues: readonly string[]) {
  let sheet = doc.sheetsByTitle[sheetName];

  if (!sheet) {
    // Clean up any stale locks before proceeding
    cleanupStaleLocks();

    // Check if another request is already creating this sheet
    const existingLock = sheetCreationLocks.get(sheetName);
    if (existingLock) {
      await existingLock.promise;
      // After waiting, reload doc to get the newly created sheet
      await doc.loadInfo();
      sheet = doc.sheetsByTitle[sheetName];
      if (sheet) return sheet;
    }

    // Create a new lock for this sheet creation
    const timestamp = Date.now();
    const creationPromise = (async () => {
      try {
        await doc.loadInfo();
        sheet = doc.sheetsByTitle[sheetName];

        if (!sheet) {
          sheet = await doc.addSheet({
            title: sheetName,
            headerValues: [...headerValues],
          });
        }

        return sheet;
      } finally {
        // Always clean up the lock, even on error
        sheetCreationLocks.delete(sheetName);
      }
    })();

    sheetCreationLocks.set(sheetName, { promise: creationPromise, timestamp });
    sheet = await creationPromise;
  }

  return sheet;
}

// Awards Sheet Operations
export async function getAwards(): Promise<Award[]> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Awards'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  return rows.map((row) => {
    // Consistent ID handling - prefer awardId, fallback to row number with prefix
    let id = row.get('awardId');
    if (!id) {
      id = `award-row-${row.rowNumber}`;
    }

    return {
      id,
      awardOrPrize: row.get('Award or Prize') || '',
      sponsor: row.get('Sponsor') || '',
      link: row.get('Link and/or more info') || '',
      division: row.get('Division') || '',
      deadlineMonth: row.get('Deadline') || '',
      monetaryAmount: row.get('Monetary Amount') || '',
      description: row.get('Description') || '',
      fieldOrDiscipline: row.get('Field or Discipline') || '',
      callStartDate: row.get('Call Start Date') || '',
      priorityRanking: row.get('Priority Ranking') || '',
      typeOfImpact: row.get('Type of Impact') || '',
      awardType: row.get('Award Type') || '',
      academicCareerLevel: row.get('Academic Career Level') || '',
      nominator: row.get('Nominator') || '',
      notes: row.get('Notes') || '',
      awardRotation: row.get('Award Rotation') || '',
      awardAnalysis: row.get('Award Analysis') || '',
      honorificsOfficeAssistance: row.get('Honorifics Office Assistance') || '',
    };
  });
}

export async function getAwardById(id: string): Promise<Award | null> {
  const awards = await getAwards();
  return awards.find((award) => award.id === id) || null;
}

export async function addAward(award: Omit<Award, 'id'>): Promise<Award> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Awards'] || doc.sheetsByIndex[0];

  // Generate a secure unique ID using UUID
  const newId = `award-${randomUUID()}`;

  const newRow = await sheet.addRow({
    'awardId': newId,
    'Award or Prize': award.awardOrPrize,
    'Sponsor': award.sponsor,
    'Link and/or more info': award.link,
    'Division': award.division,
    'Deadline': award.deadlineMonth,
    'Monetary Amount': award.monetaryAmount,
    'Description': award.description,
    'Field or Discipline': award.fieldOrDiscipline,
    'Call Start Date': award.callStartDate,
    'Priority Ranking': award.priorityRanking,
    'Type of Impact': award.typeOfImpact,
    'Award Type': award.awardType,
    'Academic Career Level': award.academicCareerLevel,
    'Nominator': award.nominator,
    'Notes': award.notes,
    'Award Rotation': award.awardRotation,
    'Award Analysis': award.awardAnalysis,
    'Honorifics Office Assistance': award.honorificsOfficeAssistance,
  });

  return {
    id: newId,
    ...award,
  };
}

// Nominations Sheet Operations
export async function getNominations(): Promise<Nomination[]> {
  const doc = await getSpreadsheet();
  const sheet = await ensureSheet(doc, 'Nominations', NOMINATION_COLUMNS);

  const rows = await sheet.getRows();
  if (rows.length === 0) return [];

  return rows.map((row) => {
    // Consistent ID handling
    let id = row.get('id');
    if (!id) {
      id = `nomination-row-${row.rowNumber}`;
    }

    // Parse numeric values with validation
    const yearStr = row.get('nominationYear') || new Date().getFullYear().toString();
    const nominationYear = parseInt(yearStr, 10);
    const supportLettersCountStr = row.get('supportLettersCount') || '0';
    const supportLettersCount = parseInt(supportLettersCountStr, 10);

    return {
      id,
      awardId: row.get('awardId') || '',
      candidateName: row.get('candidateName') || '',
      nominatedBy: row.get('nominatedBy') || '',
      nominationYear: isNaN(nominationYear) ? new Date().getFullYear() : nominationYear,
      status: (row.get('status') || 'pending') as Nomination['status'],
      letterStatus: (row.get('letterStatus') || 'not_started') as Nomination['letterStatus'],
      letterWriterName: row.get('letterWriterName') || undefined,
      letterWriterContact: row.get('letterWriterContact') || undefined,
      supportLettersStatus: (row.get('supportLettersStatus') || 'not_started') as Nomination['supportLettersStatus'],
      // Safe JSON parsing to prevent crashes
      supportLetters: safeJsonParse(row.get('supportLetters'), []),
      supportLettersCount: isNaN(supportLettersCount) ? 0 : supportLettersCount,
      packageFiles: safeJsonParse(row.get('packageFiles'), []),
      driveFolderId: row.get('driveFolderId') || undefined,
      deadlineDate: row.get('deadlineDate') || undefined,
      submissionDate: row.get('submissionDate') || undefined,
      notes: row.get('notes') || undefined,
      createdAt: row.get('createdAt') || new Date().toISOString(),
      updatedAt: row.get('updatedAt') || new Date().toISOString(),
    };
  });
}

export async function getNominationById(id: string): Promise<Nomination | null> {
  const nominations = await getNominations();
  return nominations.find((nomination) => nomination.id === id) || null;
}

export async function addNomination(nomination: Omit<Nomination, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nomination> {
  const doc = await getSpreadsheet();
  const sheet = await ensureSheet(doc, 'Nominations', NOMINATION_COLUMNS);

  const now = new Date().toISOString();
  const newId = `nomination-${randomUUID()}`;

  const newRow = await sheet.addRow({
    id: newId,
    awardId: nomination.awardId,
    candidateName: nomination.candidateName,
    nominatedBy: nomination.nominatedBy,
    nominationYear: nomination.nominationYear.toString(),
    status: nomination.status,
    letterStatus: nomination.letterStatus,
    letterWriterName: nomination.letterWriterName || '',
    letterWriterContact: nomination.letterWriterContact || '',
    supportLettersStatus: nomination.supportLettersStatus,
    supportLetters: JSON.stringify(nomination.supportLetters || []),
    supportLettersCount: (nomination.supportLettersCount || 0).toString(),
    packageFiles: JSON.stringify(nomination.packageFiles || []),
    driveFolderId: nomination.driveFolderId || '',
    deadlineDate: nomination.deadlineDate || '',
    submissionDate: nomination.submissionDate || '',
    notes: nomination.notes || '',
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: newId,
    ...nomination,
    createdAt: now,
    updatedAt: now,
  };
}

// Allowed fields for updates (security measure)
const ALLOWED_UPDATE_FIELDS = new Set([
  'candidateName',
  'nominatedBy',
  'nominationYear',
  'status',
  'letterStatus',
  'letterWriterName',
  'letterWriterContact',
  'supportLettersStatus',
  'supportLetters',
  'supportLettersCount',
  'packageFiles',
  'driveFolderId',
  'deadlineDate',
  'submissionDate',
  'notes',
]);

export async function updateNomination(id: string, updates: Partial<Nomination>): Promise<Nomination | null> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Nominations'];
  if (!sheet) {
    logger.error('updateNomination: Nominations sheet not found');
    return null;
  }

  const rows = await sheet.getRows();
  logger.debug('updateNomination: Looking for ID', { id, availableIds: rows.map(r => r.get('id')).slice(0, 5) });

  // Find row by ID, or if ID starts with "nomination-row-", find by row number
  let row = rows.find((r) => r.get('id') === id);
  let actualId = id;

  if (!row && id.startsWith('nomination-row-')) {
    const rowNumber = parseInt(id.replace('nomination-row-', ''), 10);
    if (!isNaN(rowNumber)) {
      row = rows.find((r) => r.rowNumber === rowNumber);
      logger.debug('updateNomination: Found row by row number', { rowNumber });
    }

    // If we found it by row number, set the proper UUID ID now
    if (row) {
      const newId = `nomination-${randomUUID()}`;
      row.set('id', newId);
      actualId = newId; // Track the new ID for return
      logger.debug('updateNomination: Backfilling ID', { newId });
    }
  }

  if (!row) {
    logger.error('updateNomination: Row not found for ID', undefined, { id });
    return null;
  }

  // Only update allowed fields
  Object.entries(updates).forEach(([key, value]) => {
    if (!ALLOWED_UPDATE_FIELDS.has(key) || value === undefined) {
      return;
    }

    if (key === 'packageFiles' || key === 'supportLetters') {
      row.set(key, JSON.stringify(value));
    } else if (typeof value === 'object' && value !== null) {
      // Skip objects that aren't handled above
      return;
    } else {
      row.set(key, value.toString());
    }
  });

  const updatedAt = new Date().toISOString();
  row.set('updatedAt', updatedAt);
  await row.save();

  // Return the updated nomination directly from the row data instead of re-fetching all nominations
  const yearStr = row.get('nominationYear') || new Date().getFullYear().toString();
  const nominationYear = parseInt(yearStr, 10);
  const supportLettersCountStr = row.get('supportLettersCount') || '0';
  const supportLettersCount = parseInt(supportLettersCountStr, 10);

  return {
    id: actualId,
    awardId: row.get('awardId') || '',
    candidateName: row.get('candidateName') || '',
    nominatedBy: row.get('nominatedBy') || '',
    nominationYear: isNaN(nominationYear) ? new Date().getFullYear() : nominationYear,
    status: (row.get('status') || 'pending') as Nomination['status'],
    letterStatus: (row.get('letterStatus') || 'not_started') as Nomination['letterStatus'],
    letterWriterName: row.get('letterWriterName') || undefined,
    letterWriterContact: row.get('letterWriterContact') || undefined,
    supportLettersStatus: (row.get('supportLettersStatus') || 'not_started') as Nomination['supportLettersStatus'],
    supportLetters: safeJsonParse(row.get('supportLetters'), []),
    supportLettersCount: isNaN(supportLettersCount) ? 0 : supportLettersCount,
    packageFiles: safeJsonParse(row.get('packageFiles'), []),
    driveFolderId: row.get('driveFolderId') || undefined,
    deadlineDate: row.get('deadlineDate') || undefined,
    submissionDate: row.get('submissionDate') || undefined,
    notes: row.get('notes') || undefined,
    createdAt: row.get('createdAt') || updatedAt,
    updatedAt: updatedAt,
  };
}

export async function deleteNomination(id: string): Promise<boolean> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Nominations'];
  if (!sheet) {
    logger.error('deleteNomination: Nominations sheet not found');
    return false;
  }

  const rows = await sheet.getRows();
  logger.debug('deleteNomination: Looking for ID', { id });

  // Find row by ID, or if ID starts with "nomination-row-", find by row number
  let row = rows.find((r) => r.get('id') === id);

  if (!row && id.startsWith('nomination-row-')) {
    const rowNumber = parseInt(id.replace('nomination-row-', ''), 10);
    if (!isNaN(rowNumber)) {
      row = rows.find((r) => r.rowNumber === rowNumber);
      logger.debug('deleteNomination: Found row by row number', { rowNumber });
    }
  }

  if (!row) {
    logger.error('deleteNomination: Row not found for ID', undefined, { id });
    return false;
  }

  await row.delete();
  logger.info('deleteNomination: Successfully deleted nomination', { id });
  return true;
}
