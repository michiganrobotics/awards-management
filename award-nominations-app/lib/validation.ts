import { z } from 'zod';
import { VALIDATION_LIMITS, NOMINATION_STATUS, LETTER_STATUS, SUPPORT_LETTER_STATUS } from './constants';

// Nomination validation schema
export const nominationSchema = z.object({
  awardId: z.string().min(1, 'Award ID is required'),
  candidateName: z
    .string()
    .min(1, 'Candidate name is required')
    .max(VALIDATION_LIMITS.MAX_CANDIDATE_NAME_LENGTH, 'Candidate name is too long'),
  nominatedBy: z.string().min(1, 'Nominator name is required'),
  nominationYear: z
    .number()
    .int()
    .min(VALIDATION_LIMITS.MIN_NOMINATION_YEAR, 'Year is too early')
    .max(VALIDATION_LIMITS.MAX_NOMINATION_YEAR, 'Year is too far in the future'),
  status: z.enum([
    NOMINATION_STATUS.PENDING,
    NOMINATION_STATUS.SUBMITTED,
    NOMINATION_STATUS.SUCCESSFUL,
    NOMINATION_STATUS.UNSUCCESSFUL,
  ]),
  letterStatus: z.enum([
    LETTER_STATUS.NOT_STARTED,
    LETTER_STATUS.REQUESTED,
    LETTER_STATUS.IN_PROGRESS,
    LETTER_STATUS.COMPLETED,
  ]),
  letterWriterName: z.string().optional(),
  letterWriterContact: z.string().optional(),
  supportLettersStatus: z.enum([
    SUPPORT_LETTER_STATUS.NOT_STARTED,
    SUPPORT_LETTER_STATUS.REQUESTED,
    SUPPORT_LETTER_STATUS.RECEIVED,
  ]),
  supportLetters: z
    .array(
      z.object({
        name: z.string(),
        contact: z.string(),
        status: z.enum([
          SUPPORT_LETTER_STATUS.NOT_STARTED,
          SUPPORT_LETTER_STATUS.REQUESTED,
          SUPPORT_LETTER_STATUS.RECEIVED,
        ]),
      })
    )
    .max(VALIDATION_LIMITS.MAX_SUPPORT_LETTERS, 'Too many support letters')
    .optional(),
  supportLettersCount: z.number().int().min(0).max(VALIDATION_LIMITS.MAX_SUPPORT_LETTERS).optional(),
  packageFiles: z.array(z.string()).optional(),
  driveFolderId: z.string().optional(),
  deadlineDate: z.string().optional(),
  submissionDate: z.string().optional(),
  notes: z.string().max(VALIDATION_LIMITS.MAX_NOTES_LENGTH, 'Notes are too long').optional(),
});

export const nominationUpdateSchema = nominationSchema.partial();

export const createNominationSchema = nominationSchema.omit({
  status: true,
  letterStatus: true,
  supportLettersStatus: true,
}).extend({
  status: z.enum([
    NOMINATION_STATUS.PENDING,
    NOMINATION_STATUS.SUBMITTED,
    NOMINATION_STATUS.SUCCESSFUL,
    NOMINATION_STATUS.UNSUCCESSFUL,
  ]).default(NOMINATION_STATUS.PENDING),
  letterStatus: z.enum([
    LETTER_STATUS.NOT_STARTED,
    LETTER_STATUS.REQUESTED,
    LETTER_STATUS.IN_PROGRESS,
    LETTER_STATUS.COMPLETED,
  ]).default(LETTER_STATUS.NOT_STARTED),
  supportLettersStatus: z.enum([
    SUPPORT_LETTER_STATUS.NOT_STARTED,
    SUPPORT_LETTER_STATUS.REQUESTED,
    SUPPORT_LETTER_STATUS.RECEIVED,
  ]).default(SUPPORT_LETTER_STATUS.NOT_STARTED),
});

// Award validation schema
export const awardSchema = z.object({
  awardOrPrize: z.string().min(1, 'Award name is required'),
  sponsor: z.string(),
  link: z.string().url().or(z.literal('')),
  division: z.string(),
  deadlineMonth: z.string(),
  monetaryAmount: z.string(),
  description: z.string(),
  fieldOrDiscipline: z.string(),
  callStartDate: z.string(),
  priorityRanking: z.string(),
  typeOfImpact: z.string(),
  awardType: z.string(),
  academicCareerLevel: z.string(),
  nominator: z.string(),
  notes: z.string(),
  awardRotation: z.string(),
  awardAnalysis: z.string(),
  honorificsOfficeAssistance: z.string(),
});

// File upload validation
export const fileUploadSchema = z.object({
  nominationId: z.string().min(1, 'Nomination ID is required'),
  category: z.enum(['letter', 'support_letter', 'cv', 'publication', 'other']),
});

/**
 * Validate and sanitize input data
 */
export function validateNomination(data: unknown) {
  return nominationSchema.parse(data);
}

export function validateNominationUpdate(data: unknown) {
  // Preprocess data to remove empty strings and convert them to undefined
  // This prevents validation errors when frontend sends "" for optional enum fields
  console.log('validateNominationUpdate - Raw data:', JSON.stringify(data));

  const cleanData = typeof data === 'object' && data !== null
    ? Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '')
      )
    : data;

  console.log('validateNominationUpdate - Cleaned data:', JSON.stringify(cleanData));

  return nominationUpdateSchema.parse(cleanData);
}

export function validateCreateNomination(data: unknown) {
  return createNominationSchema.parse(data);
}

export function validateAward(data: unknown) {
  return awardSchema.parse(data);
}

export function validateFileUpload(data: unknown) {
  return fileUploadSchema.parse(data);
}
