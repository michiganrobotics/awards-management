/**
 * Nomination operations shared by the CLI (scripts/nominations.ts) and the
 * MCP server (app/mcp). Same validation as the web app's API routes, plus the
 * checks a person clicking through the UI would do by eye: the award exists,
 * and the nomination isn't a duplicate.
 */
import {
  getAwards,
  getAwardById,
  getNominations,
  getNominationById,
  addNomination,
  updateNomination,
} from './google-sheets';
import { listFiles } from './google-drive';
import { validateCreateNomination, validateNominationUpdate } from './validation';
import type { Award, Nomination } from './types';

/** A problem with the caller's input, safe to show them as-is. */
export class NominationInputError extends Error {
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'NominationInputError';
    this.details = details;
  }
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function summarizeAward(award: Award) {
  return {
    id: award.id,
    name: award.awardOrPrize,
    sponsor: award.sponsor,
    deadline: award.deadlineMonth,
    careerLevel: award.academicCareerLevel,
    link: award.link,
  };
}

/** Awards whose name or sponsor contain every word of the query. */
export async function searchAwards(query = '') {
  const awards = await getAwards();
  const words = normalize(query).split(' ').filter(Boolean);
  return awards
    .filter((award) => {
      const haystack = normalize(`${award.awardOrPrize} ${award.sponsor}`);
      return words.every((word) => haystack.includes(word));
    })
    .map(summarizeAward);
}

export async function listNominations(filters: {
  awardId?: string;
  candidate?: string;
  year?: number;
  status?: string;
}) {
  const [nominations, awards] = await Promise.all([getNominations(), getAwards()]);
  return nominations
    .filter(
      (n) =>
        (!filters.awardId || n.awardId === filters.awardId) &&
        (!filters.candidate || normalize(n.candidateName).includes(normalize(filters.candidate))) &&
        (!filters.year || n.nominationYear === filters.year) &&
        (!filters.status || n.status === filters.status)
    )
    .map((n) => ({
      id: n.id,
      candidateName: n.candidateName,
      award: awards.find((a) => a.id === n.awardId)?.awardOrPrize || `(unknown award ${n.awardId})`,
      awardId: n.awardId,
      nominationYear: n.nominationYear,
      status: n.status,
      letterStatus: n.letterStatus,
      supportLettersStatus: n.supportLettersStatus,
      deadlineDate: n.deadlineDate,
    }));
}

/** One nomination, its award, and the files in its Drive folder. */
export async function getNominationDetails(id: string) {
  const nomination = await getNominationById(id);
  if (!nomination) throw new NominationInputError(`Nomination not found: ${id}`);
  const award = await getAwardById(nomination.awardId);
  const files = nomination.driveFolderId
    ? (await listFiles(nomination.driveFolderId)).map((f) => ({
        name: f.name,
        link: f.webViewLink,
        createdTime: f.createdTime,
      }))
    : [];
  return { nomination, award: award ? summarizeAward(award) : null, files };
}

function withSupportLettersCount(input: unknown): unknown {
  if (typeof input === 'object' && input !== null) {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.supportLetters) && record.supportLettersCount === undefined) {
      return { ...record, supportLettersCount: record.supportLetters.length };
    }
  }
  return input;
}

export async function createNomination(input: unknown, options: { dryRun?: boolean; force?: boolean } = {}) {
  const data = validateCreateNomination(withSupportLettersCount(input));

  const award = await getAwardById(data.awardId);
  if (!award) {
    throw new NominationInputError(`No award with id ${data.awardId}. Search the awards to find the right id.`);
  }

  const existing = (await getNominations()).filter(
    (n) =>
      n.awardId === data.awardId &&
      n.nominationYear === data.nominationYear &&
      normalize(n.candidateName) === normalize(data.candidateName)
  );
  if (existing.length > 0 && !options.force) {
    throw new NominationInputError(
      'A nomination for this candidate, award and year already exists. Update it instead, or force a second one.',
      { existing: existing.map((n) => n.id) }
    );
  }

  // Awards without an awardId in the sheet get a row-number id, which breaks if rows move.
  const warning = data.awardId.startsWith('award-row-')
    ? 'This award has no awardId in the Awards sheet, so the link will break if rows are reordered. Ask an admin to fill in its awardId.'
    : undefined;

  if (options.dryRun) {
    return { dryRun: true, wouldCreate: data, award: summarizeAward(award), warning };
  }
  const created = await addNomination(data);
  return { created, award: summarizeAward(award), warning };
}

export async function updateNominationFields(id: string, input: unknown, options: { dryRun?: boolean } = {}) {
  const updates = validateNominationUpdate(withSupportLettersCount(input));
  if ('awardId' in updates) {
    throw new NominationInputError('awardId cannot be changed. Create a new nomination for the other award instead.');
  }

  const current = await getNominationById(id);
  if (!current) throw new NominationInputError(`Nomination not found: ${id}`);

  if (options.dryRun) {
    const changes = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        { from: current[key as keyof Nomination], to: value },
      ])
    );
    return { dryRun: true, id, changes };
  }
  const updated = await updateNomination(id, updates);
  return { updated };
}
