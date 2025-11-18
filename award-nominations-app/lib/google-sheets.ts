import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Award, Nomination } from './types';
import { safeJsonParse } from './api-utils';
import { AWARD_COLUMNS, NOMINATION_COLUMNS } from './constants';
import { randomUUID } from 'crypto';

// Initialize auth
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Sheet creation lock to prevent race conditions
const sheetCreationLocks = new Map<string, Promise<any>>();

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
    // Check if another request is already creating this sheet
    const existingLock = sheetCreationLocks.get(sheetName);
    if (existingLock) {
      await existingLock;
      // After waiting, reload doc to get the newly created sheet
      await doc.loadInfo();
      sheet = doc.sheetsByTitle[sheetName];
      if (sheet) return sheet;
    }

    // Create a new lock for this sheet creation
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
        sheetCreationLocks.delete(sheetName);
      }
    })();

    sheetCreationLocks.set(sheetName, creationPromise);
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
    let id = row.get(AWARD_COLUMNS.AWARD_ID);
    if (!id) {
      // If no awardId, generate one based on row number
      id = `award-row-${row.rowNumber}`;
    }

    return {
      id,
      awardOrPrize: row.get(AWARD_COLUMNS.AWARD_OR_PRIZE) || '',
      sponsor: row.get(AWARD_COLUMNS.SPONSOR) || '',
      link: row.get(AWARD_COLUMNS.LINK) || '',
      division: row.get(AWARD_COLUMNS.DIVISION) || '',
      deadlineMonth: row.get(AWARD_COLUMNS.DEADLINE) || '',
      monetaryAmount: row.get(AWARD_COLUMNS.MONETARY_AMOUNT) || '',
      description: row.get(AWARD_COLUMNS.DESCRIPTION) || '',
      fieldOrDiscipline: row.get(AWARD_COLUMNS.FIELD_OR_DISCIPLINE) || '',
      callForNoms: row.get(AWARD_COLUMNS.CALL_FOR_NOMS) || '',
      priorityRanking: row.get(AWARD_COLUMNS.PRIORITY_RANKING) || '',
      addedFrom: row.get(AWARD_COLUMNS.ADDED_FROM) || '',
      typeOfImpact: row.get(AWARD_COLUMNS.TYPE_OF_IMPACT) || '',
      awardType: row.get(AWARD_COLUMNS.AWARD_TYPE) || '',
      academicCareerLevel: row.get(AWARD_COLUMNS.ACADEMIC_CAREER_LEVEL) || '',
      reasonsToRemove: row.get(AWARD_COLUMNS.REASONS_TO_REMOVE) || '',
      limited: row.get(AWARD_COLUMNS.LIMITED) || '',
      nominator: row.get(AWARD_COLUMNS.NOMINATOR) || '',
      nominationViability: row.get(AWARD_COLUMNS.NOMINATION_VIABILITY) || '',
      selfNominations: row.get(AWARD_COLUMNS.SELF_NOMINATIONS) || '',
      confidential: row.get(AWARD_COLUMNS.CONFIDENTIAL) || '',
      currentlyManagedBy: row.get(AWARD_COLUMNS.CURRENTLY_MANAGED_BY) || '',
      notes: row.get(AWARD_COLUMNS.NOTES) || '',
      toBeManagedBy: row.get(AWARD_COLUMNS.TO_BE_MANAGED_BY) || '',
      mitPaper: row.get(AWARD_COLUMNS.MIT_PAPER) || '',
      nominationRequestFrom: row.get(AWARD_COLUMNS.NOMINATION_REQUEST_FROM) || '',
      logo: row.get(AWARD_COLUMNS.LOGO) || '',
      nominations: row.get(AWARD_COLUMNS.NOMINATIONS) || '',
      awardRotation: row.get(AWARD_COLUMNS.AWARD_ROTATION) || '',
      awardAnalysis: row.get(AWARD_COLUMNS.AWARD_ANALYSIS) || '',
      heritageAward: row.get(AWARD_COLUMNS.HERITAGE_AWARD) || '',
      faculty: row.get(AWARD_COLUMNS.FACULTY) || '',
      faculty2: row.get(AWARD_COLUMNS.FACULTY_2) || '',
      faculty3: row.get(AWARD_COLUMNS.FACULTY_3) || '',
      candidateSuggestions2024: row.get(AWARD_COLUMNS.CANDIDATE_SUGGESTIONS_2024) || '',
      candidateSuggestions: row.get(AWARD_COLUMNS.CANDIDATE_SUGGESTIONS) || '',
      suggestedCandidate: row.get(AWARD_COLUMNS.SUGGESTED_CANDIDATE) || '',
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
    [AWARD_COLUMNS.AWARD_ID]: newId,
    [AWARD_COLUMNS.AWARD_OR_PRIZE]: award.awardOrPrize,
    [AWARD_COLUMNS.SPONSOR]: award.sponsor,
    [AWARD_COLUMNS.LINK]: award.link,
    [AWARD_COLUMNS.DIVISION]: award.division,
    'Deadline Month': award.deadlineMonth,
    [AWARD_COLUMNS.MONETARY_AMOUNT]: award.monetaryAmount,
    [AWARD_COLUMNS.DESCRIPTION]: award.description,
    [AWARD_COLUMNS.FIELD_OR_DISCIPLINE]: award.fieldOrDiscipline,
    [AWARD_COLUMNS.CALL_FOR_NOMS]: award.callForNoms,
    [AWARD_COLUMNS.PRIORITY_RANKING]: award.priorityRanking,
    [AWARD_COLUMNS.ADDED_FROM]: award.addedFrom,
    [AWARD_COLUMNS.TYPE_OF_IMPACT]: award.typeOfImpact,
    [AWARD_COLUMNS.AWARD_TYPE]: award.awardType,
    [AWARD_COLUMNS.ACADEMIC_CAREER_LEVEL]: award.academicCareerLevel,
    [AWARD_COLUMNS.REASONS_TO_REMOVE]: award.reasonsToRemove,
    [AWARD_COLUMNS.LIMITED]: award.limited,
    [AWARD_COLUMNS.NOMINATOR]: award.nominator,
    [AWARD_COLUMNS.NOMINATION_VIABILITY]: award.nominationViability,
    [AWARD_COLUMNS.SELF_NOMINATIONS]: award.selfNominations,
    [AWARD_COLUMNS.CONFIDENTIAL]: award.confidential,
    [AWARD_COLUMNS.CURRENTLY_MANAGED_BY]: award.currentlyManagedBy,
    [AWARD_COLUMNS.NOTES]: award.notes,
    [AWARD_COLUMNS.TO_BE_MANAGED_BY]: award.toBeManagedBy,
    [AWARD_COLUMNS.MIT_PAPER]: award.mitPaper,
    [AWARD_COLUMNS.NOMINATION_REQUEST_FROM]: award.nominationRequestFrom,
    [AWARD_COLUMNS.LOGO]: award.logo,
    [AWARD_COLUMNS.NOMINATIONS]: award.nominations,
    [AWARD_COLUMNS.AWARD_ROTATION]: award.awardRotation,
    [AWARD_COLUMNS.AWARD_ANALYSIS]: award.awardAnalysis,
    [AWARD_COLUMNS.HERITAGE_AWARD]: award.heritageAward,
    [AWARD_COLUMNS.FACULTY]: award.faculty,
    [AWARD_COLUMNS.FACULTY_2]: award.faculty2,
    [AWARD_COLUMNS.FACULTY_3]: award.faculty3,
    [AWARD_COLUMNS.CANDIDATE_SUGGESTIONS_2024]: award.candidateSuggestions2024,
    [AWARD_COLUMNS.CANDIDATE_SUGGESTIONS]: award.candidateSuggestions,
    [AWARD_COLUMNS.SUGGESTED_CANDIDATE]: award.suggestedCandidate,
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

    return {
      id,
      awardId: row.get('awardId') || '',
      candidateName: row.get('candidateName') || '',
      nominatedBy: row.get('nominatedBy') || '',
      nominationYear: parseInt(row.get('nominationYear') || new Date().getFullYear().toString(), 10),
      status: (row.get('status') || 'pending') as Nomination['status'],
      letterStatus: (row.get('letterStatus') || 'not_started') as Nomination['letterStatus'],
      letterWriterName: row.get('letterWriterName') || undefined,
      letterWriterContact: row.get('letterWriterContact') || undefined,
      supportLettersStatus: (row.get('supportLettersStatus') || 'not_started') as Nomination['supportLettersStatus'],
      // Safe JSON parsing to prevent crashes
      supportLetters: safeJsonParse(row.get('supportLetters'), []),
      supportLettersCount: parseInt(row.get('supportLettersCount') || '0', 10),
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
  if (!sheet) return null;

  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);

  if (!row) return null;

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

  row.set('updatedAt', new Date().toISOString());
  await row.save();

  const nominations = await getNominations();
  return nominations.find((n) => n.id === id) || null;
}
