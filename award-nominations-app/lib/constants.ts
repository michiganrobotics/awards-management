// Nomination Status
export const NOMINATION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  SUCCESSFUL: 'successful',
  UNSUCCESSFUL: 'unsuccessful',
} as const;

export type NominationStatus = typeof NOMINATION_STATUS[keyof typeof NOMINATION_STATUS];

// Letter Status
export const LETTER_STATUS = {
  NOT_STARTED: 'not_started',
  REQUESTED: 'requested',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type LetterStatus = typeof LETTER_STATUS[keyof typeof LETTER_STATUS];

// Support Letter Status
export const SUPPORT_LETTER_STATUS = {
  NOT_STARTED: 'not_started',
  REQUESTED: 'requested',
  RECEIVED: 'received',
} as const;

export type SupportLetterStatus = typeof SUPPORT_LETTER_STATUS[keyof typeof SUPPORT_LETTER_STATUS];

// File Categories
export const FILE_CATEGORY = {
  LETTER: 'letter',
  SUPPORT_LETTER: 'support_letter',
  CV: 'cv',
  PUBLICATION: 'publication',
  OTHER: 'other',
} as const;

export type FileCategory = typeof FILE_CATEGORY[keyof typeof FILE_CATEGORY];

// Google Sheets Column Names
export const AWARD_COLUMNS = {
  AWARD_ID: 'awardId',
  AWARD_OR_PRIZE: 'Award or Prize',
  SPONSOR: 'Sponsor',
  LINK: 'Link and/or more info',
  DIVISION: 'Division',
  DEADLINE: 'Deadline',
  MONETARY_AMOUNT: 'Monetary Amount',
  DESCRIPTION: 'Description',
  FIELD_OR_DISCIPLINE: 'Field or Discipline',
  CALL_FOR_NOMS: 'Call for Noms',
  PRIORITY_RANKING: 'Priority Ranking',
  ADDED_FROM: 'Added from',
  TYPE_OF_IMPACT: 'Type of Impact',
  AWARD_TYPE: 'Award Type',
  ACADEMIC_CAREER_LEVEL: 'Academic Career Level',
  REASONS_TO_REMOVE: 'Reason(s) to remove or not promote',
  LIMITED: 'Limited',
  NOMINATOR: 'Nominator',
  NOMINATION_VIABILITY: 'Nomination Viability',
  SELF_NOMINATIONS: 'Self nominations',
  CONFIDENTIAL: 'Confidential',
  CURRENTLY_MANAGED_BY: 'Currently managed by',
  NOTES: 'Notes',
  TO_BE_MANAGED_BY: 'To be managed by',
  MIT_PAPER: 'MIT paper',
  NOMINATION_REQUEST_FROM: 'Nomination request from?',
  LOGO: 'Logo',
  NOMINATIONS: 'Nominations',
  AWARD_ROTATION: 'Award Rotation',
  AWARD_ANALYSIS: 'Award Analysis',
  HERITAGE_AWARD: 'Heritage Award?',
  FACULTY: 'Faculty',
  FACULTY_2: 'Faculty 2',
  FACULTY_3: 'Faculty 3',
  CANDIDATE_SUGGESTIONS_2024: 'Candidate Suggestions 2024',
  CANDIDATE_SUGGESTIONS: 'Candidate Suggestions',
  SUGGESTED_CANDIDATE: 'Suggested Candidate (from Candidate Suggestions )',
} as const;

export const NOMINATION_COLUMNS = [
  'id',
  'awardId',
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
  'createdAt',
  'updatedAt',
] as const;

// Validation limits
export const VALIDATION_LIMITS = {
  MAX_CANDIDATE_NAME_LENGTH: 200,
  MAX_NOTES_LENGTH: 5000,
  MIN_NOMINATION_YEAR: 2000,
  MAX_NOMINATION_YEAR: 2100,
  MAX_SUPPORT_LETTERS: 5,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
} as const;
