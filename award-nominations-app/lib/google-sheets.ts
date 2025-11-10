import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Award, Nomination } from './types';

// Initialize auth
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

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

// Awards Sheet Operations
export async function getAwards(): Promise<Award[]> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Awards'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    id: row.get('id') || row.rowNumber.toString(),
    awardOrPrize: row.get('Award or Prize') || '',
    sponsor: row.get('Sponsor') || '',
    link: row.get('Link and/or more info') || '',
    division: row.get('Division') || '',
    deadlineMonth: row.get('Deadline') || '',
    monetaryAmount: row.get('Monetary Amount') || '',
    description: row.get('Description') || '',
    fieldOrDiscipline: row.get('Field or Discipline') || '',
    callForNoms: row.get('Call for Noms') || '',
    priorityRanking: row.get('Priority Ranking') || '',
    addedFrom: row.get('Added from') || '',
    typeOfImpact: row.get('Type of Impact') || '',
    awardType: row.get('Award Type') || '',
    academicCareerLevel: row.get('Academic Career Level') || '',
    reasonsToRemove: row.get('Reason(s) to remove or not promote') || '',
    limited: row.get('Limited') || '',
    nominator: row.get('Nominator') || '',
    nominationViability: row.get('Nomination Viability') || '',
    selfNominations: row.get('Self nominations') || '',
    confidential: row.get('Confidential') || '',
    currentlyManagedBy: row.get('Currently managed by') || '',
    notes: row.get('Notes') || '',
    toBeManagedBy: row.get('To be managed by') || '',
    mitPaper: row.get('MIT paper') || '',
    nominationRequestFrom: row.get('Nomination request from?') || '',
    logo: row.get('Logo') || '',
    nominations: row.get('Nominations') || '',
    awardRotation: row.get('Award Rotation') || '',
    awardAnalysis: row.get('Award Analysis') || '',
    heritageAward: row.get('Heritage Award?') || '',
    faculty: row.get('Faculty') || '',
    faculty2: row.get('Faculty 2') || '',
    faculty3: row.get('Faculty 3') || '',
    candidateSuggestions2024: row.get('Candidate Suggestions 2024') || '',
    candidateSuggestions: row.get('Candidate Suggestions') || '',
    suggestedCandidate: row.get('Suggested Candidate (from Candidate Suggestions )') || '',
  }));
}

export async function getAwardById(id: string): Promise<Award | null> {
  const awards = await getAwards();
  return awards.find((award) => award.id === id) || null;
}

export async function addAward(award: Omit<Award, 'id'>): Promise<Award> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Awards'] || doc.sheetsByIndex[0];

  const newRow = await sheet.addRow({
    'Award or Prize': award.awardOrPrize,
    'Sponsor': award.sponsor,
    'Link and/or more info': award.link,
    'Division': award.division,
    'Deadline Month': award.deadlineMonth,
    'Monetary Amount': award.monetaryAmount,
    'Description': award.description,
    'Field or Discipline': award.fieldOrDiscipline,
    'Call for Noms': award.callForNoms,
    'Priority Ranking': award.priorityRanking,
    'Added from': award.addedFrom,
    'Type of Impact': award.typeOfImpact,
    'Award Type': award.awardType,
    'Academic Career Level': award.academicCareerLevel,
    'Reason(s) to remove or not promote': award.reasonsToRemove,
    'Limited': award.limited,
    'Nominator': award.nominator,
    'Nomination Viability': award.nominationViability,
    'Self nominations': award.selfNominations,
    'Confidential': award.confidential,
    'Currently managed by': award.currentlyManagedBy,
    'Notes': award.notes,
    'To be managed by': award.toBeManagedBy,
    'MIT paper': award.mitPaper,
    'Nomination request from?': award.nominationRequestFrom,
    'Logo': award.logo,
    'Nominations': award.nominations,
    'Award Rotation': award.awardRotation,
    'Award Analysis': award.awardAnalysis,
    'Heritage Award?': award.heritageAward,
    'Faculty': award.faculty,
    'Faculty 2': award.faculty2,
    'Faculty 3': award.faculty3,
    'Candidate Suggestions 2024': award.candidateSuggestions2024,
    'Candidate Suggestions': award.candidateSuggestions,
    'Suggested Candidate (from Candidate Suggestions )': award.suggestedCandidate,
  });

  return {
    id: newRow.rowNumber.toString(),
    ...award,
  };
}

// Nominations Sheet Operations
export async function getNominations(): Promise<Nomination[]> {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle['Nominations'];

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'Nominations',
      headerValues: [
        'id', 'awardId', 'candidateName', 'nominatedBy', 'nominationYear',
        'status', 'letterStatus', 'letterWriterName', 'letterWriterContact', 'supportLettersStatus', 'supportLetters', 'supportLettersCount',
        'packageFiles', 'driveFolderId', 'deadlineDate', 'submissionDate', 'notes', 'createdAt', 'updatedAt'
      ]
    });
    return [];
  }

  const rows = await sheet.getRows();
  return rows.map((row) => ({
    id: row.get('id') || row.rowNumber.toString(),
    awardId: row.get('awardId') || '',
    candidateName: row.get('candidateName') || '',
    nominatedBy: row.get('nominatedBy') || '',
    nominationYear: parseInt(row.get('nominationYear') || new Date().getFullYear().toString()),
    status: (row.get('status') || 'pending') as Nomination['status'],
    letterStatus: (row.get('letterStatus') || 'not_started') as Nomination['letterStatus'],
    letterWriterName: row.get('letterWriterName') || undefined,
    letterWriterContact: row.get('letterWriterContact') || undefined,
    supportLettersStatus: (row.get('supportLettersStatus') || 'not_started') as Nomination['supportLettersStatus'],
    supportLetters: row.get('supportLetters') ? JSON.parse(row.get('supportLetters')) : [],
    supportLettersCount: parseInt(row.get('supportLettersCount') || '0'),
    packageFiles: row.get('packageFiles') ? JSON.parse(row.get('packageFiles')) : [],
    driveFolderId: row.get('driveFolderId') || undefined,
    deadlineDate: row.get('deadlineDate') || undefined,
    submissionDate: row.get('submissionDate') || undefined,
    notes: row.get('notes') || undefined,
    createdAt: row.get('createdAt') || new Date().toISOString(),
    updatedAt: row.get('updatedAt') || new Date().toISOString(),
  }));
}

export async function addNomination(nomination: Omit<Nomination, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nomination> {
  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle['Nominations'];

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = await doc.addSheet({
      title: 'Nominations',
      headerValues: [
        'id', 'awardId', 'candidateName', 'nominatedBy', 'nominationYear',
        'status', 'letterStatus', 'letterWriterName', 'letterWriterContact', 'supportLettersStatus', 'supportLetters', 'supportLettersCount',
        'packageFiles', 'driveFolderId', 'deadlineDate', 'submissionDate', 'notes', 'createdAt', 'updatedAt'
      ]
    });
  }

  const now = new Date().toISOString();
  const newRow = await sheet.addRow({
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
    id: newRow.rowNumber.toString(),
    ...nomination,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateNomination(id: string, updates: Partial<Nomination>): Promise<Nomination | null> {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle['Nominations'];
  if (!sheet) return null;

  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id || r.rowNumber.toString() === id);

  if (!row) return null;

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
      if (key === 'packageFiles' || key === 'supportLetters') {
        row.set(key, JSON.stringify(value));
      } else if (typeof value === 'object' && value !== null) {
        // Skip objects that aren't packageFiles or supportLetters
        return;
      } else {
        row.set(key, value.toString());
      }
    }
  });

  row.set('updatedAt', new Date().toISOString());
  await row.save();

  const nominations = await getNominations();
  return nominations.find((n) => n.id === id) || null;
}
