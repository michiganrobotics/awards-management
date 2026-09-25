/**
 * MCP tools for award nominations, served at /mcp (app/mcp/route.ts) so any
 * Claude — claude.ai, Desktop, mobile, Claude Code — can add it as a connector.
 * Uses the same service layer as the CLI, so validation matches the web app.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, ZodError } from 'zod';
import {
  NominationInputError,
  createNomination,
  getNominationDetails,
  listNominations,
  searchAwards,
  updateNominationFields,
} from './nomination-service';
import { GOOGLE_DOC_MIME_TYPE, NominationNotFoundError, uploadNominationFile } from './nomination-files';
import { FILE_CATEGORY, LETTER_STATUS, NOMINATION_STATUS, SUPPORT_LETTER_STATUS, VALIDATION_LIMITS } from './constants';
import type { McpUser } from './mcp-auth';
import { logger } from './logger';

const INSTRUCTIONS = `Tracks award nominations for U-M Robotics (the same data as the awards web app).

When asked to add a nomination (e.g. "add a nomination for Jane Doe for the X award, here's the draft, these people are writing support letters"):
1. search_awards with a few distinctive words. If several or none match, show the options and ask; never guess an award id.
2. list_nominations for that award and candidate. If one exists, update it instead of creating another.
3. Ask for anything required that's missing: who is nominating (nominatedBy) and the award cycle year (nominationYear). Support letter writers' contact info is optional.
4. Call create_nomination with dry_run=true, show the person a short summary (award, candidate, nominator, year, support writers, status), and create it only after they confirm.
5. Save the draft letter with save_nomination_document (category "letter"); it becomes a Google Doc in the nomination's Drive folder. Use the draft's full text as given; don't rewrite it unless asked.
6. Reply with what was recorded and the document link.

Status values are exact lowercase strings. When changing supportLetters, send the whole list (get_nomination first); it is replaced, not merged. Deleting nominations is only possible in the web app.`;

const nominationStatus = z.enum(Object.values(NOMINATION_STATUS) as [string, ...string[]]);
const letterStatus = z.enum(Object.values(LETTER_STATUS) as [string, ...string[]]);
const supportLetterStatus = z.enum(Object.values(SUPPORT_LETTER_STATUS) as [string, ...string[]]);
const fileCategory = z.enum(Object.values(FILE_CATEGORY) as [string, ...string[]]);

const supportLetter = z.object({
  name: z.string().describe('Letter writer’s name'),
  contact: z.string().describe('Email or other contact; empty string if unknown'),
  status: supportLetterStatus.describe('not_started, requested, or received'),
});

// Fields shared by create and update (all optional here; create requires some below).
const nominationFields = {
  candidateName: z.string().describe('Person being nominated'),
  nominatedBy: z.string().describe('Person making the nomination'),
  nominationYear: z.number().int().describe('Award cycle year, e.g. 2026'),
  status: nominationStatus.describe('Overall status; new nominations are usually "pending"'),
  letterStatus: letterStatus.describe('Main nomination letter; "in_progress" once a draft exists'),
  letterWriterName: z.string().describe('Who writes the main letter (often the nominator)'),
  letterWriterContact: z.string().describe('Main letter writer’s email'),
  supportLettersStatus: supportLetterStatus.describe('Overall status of support letters'),
  supportLetters: z
    .array(supportLetter)
    .max(VALIDATION_LIMITS.MAX_SUPPORT_LETTERS)
    .describe(`Support letter writers (max ${VALIDATION_LIMITS.MAX_SUPPORT_LETTERS}). Replaces the whole list.`),
  deadlineDate: z.string().describe('Submission deadline, YYYY-MM-DD'),
  submissionDate: z.string().describe('Date submitted, YYYY-MM-DD'),
  notes: z.string().max(VALIDATION_LIMITS.MAX_NOTES_LENGTH).describe('Free-text notes'),
};

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

function result(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string, details?: unknown): ToolResult {
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: message, details }, null, 2) }] };
}

async function run(tool: string, fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return result(await fn());
  } catch (error) {
    if (error instanceof NominationInputError) return errorResult(error.message, error.details);
    if (error instanceof NominationNotFoundError) return errorResult(error.message);
    if (error instanceof ZodError) {
      return errorResult(
        'Validation failed',
        error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }
    logger.error(`MCP tool ${tool} failed`, error);
    return errorResult(`Something went wrong in ${tool}. Try again, or use the web app.`);
  }
}

export function createMcpServer(user: McpUser): McpServer {
  const server = new McpServer({ name: 'award-nominations', version: '1.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool(
    'search_awards',
    {
      title: 'Search awards',
      description: 'Find awards whose name or sponsor contain all the given words. Returns award ids for use in other tools.',
      inputSchema: { query: z.string().optional().describe('Words from the award name or sponsor; empty lists all awards') },
      annotations: { readOnlyHint: true },
    },
    ({ query }) => run('search_awards', () => searchAwards(query))
  );

  server.registerTool(
    'list_nominations',
    {
      title: 'List nominations',
      description: 'List nominations, optionally filtered by award, candidate name, year or status.',
      inputSchema: {
        awardId: z.string().optional().describe('Award id from search_awards'),
        candidate: z.string().optional().describe('Part of the candidate’s name'),
        year: z.number().int().optional().describe('Nomination year'),
        status: nominationStatus.optional(),
      },
      annotations: { readOnlyHint: true },
    },
    (filters) => run('list_nominations', () => listNominations(filters))
  );

  server.registerTool(
    'get_nomination',
    {
      title: 'Get nomination',
      description: 'Full details of one nomination, its award, and links to the files in its Drive folder.',
      inputSchema: { nominationId: z.string() },
      annotations: { readOnlyHint: true },
    },
    ({ nominationId }) => run('get_nomination', () => getNominationDetails(nominationId))
  );

  server.registerTool(
    'create_nomination',
    {
      title: 'Create nomination',
      description:
        'Create a nomination. Call with dry_run=true first and confirm with the person before creating. Refuses duplicates (same candidate, award and year) unless force=true.',
      inputSchema: {
        awardId: z.string().describe('Award id from search_awards'),
        ...nominationFields,
        status: nominationFields.status.optional(),
        letterStatus: nominationFields.letterStatus.optional(),
        letterWriterName: nominationFields.letterWriterName.optional(),
        letterWriterContact: nominationFields.letterWriterContact.optional(),
        supportLettersStatus: nominationFields.supportLettersStatus.optional(),
        supportLetters: nominationFields.supportLetters.optional(),
        deadlineDate: nominationFields.deadlineDate.optional(),
        submissionDate: nominationFields.submissionDate.optional(),
        notes: nominationFields.notes.optional(),
        dry_run: z.boolean().optional().describe('Validate and preview without saving'),
        force: z.boolean().optional().describe('Create even if a matching nomination exists'),
      },
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    ({ dry_run, force, ...fields }) =>
      run('create_nomination', async () => {
        const outcome = await createNomination(fields, { dryRun: dry_run, force });
        if ('created' in outcome && outcome.created) {
          logger.audit('MCP create_nomination', { user: user.email, id: outcome.created.id, award: fields.awardId });
        }
        return outcome;
      })
  );

  server.registerTool(
    'update_nomination',
    {
      title: 'Update nomination',
      description:
        'Change fields on a nomination; only the fields given are changed. supportLetters replaces the whole list. Use dry_run=true to preview the before/after.',
      inputSchema: {
        nominationId: z.string(),
        ...Object.fromEntries(Object.entries(nominationFields).map(([key, schema]) => [key, schema.optional()])),
        dry_run: z.boolean().optional().describe('Preview the changes without saving'),
      } as Record<string, z.ZodType>,
      annotations: { destructiveHint: true, idempotentHint: true },
    },
    (args: Record<string, unknown>) =>
      run('update_nomination', async () => {
        const { nominationId, dry_run, ...fields } = args;
        const outcome = await updateNominationFields(String(nominationId), fields, { dryRun: dry_run === true });
        if ('updated' in outcome) {
          logger.audit('MCP update_nomination', { user: user.email, id: nominationId, fields: Object.keys(fields) });
        }
        return outcome;
      })
  );

  server.registerTool(
    'save_nomination_document',
    {
      title: 'Save document to nomination',
      description:
        'Save text (e.g. a draft nomination letter) into the nomination’s Drive folder, as a Google Doc by default. Markdown formatting is kept where Drive supports it.',
      inputSchema: {
        nominationId: z.string(),
        title: z.string().min(1).max(200).describe('Document name, e.g. "Draft nomination letter - Jane Doe"'),
        content: z.string().min(1).describe('Full text of the document; markdown allowed'),
        category: fileCategory.optional().describe('letter (default), support_letter, cv, publication, or other'),
        format: z.enum(['google_doc', 'markdown_file']).optional().describe('google_doc (default) or a .md file'),
      },
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    ({ nominationId, title, content, category, format }) =>
      run('save_nomination_document', async () => {
        const buffer = Buffer.from(content, 'utf8');
        const base = { nominationId, buffer, category: category || FILE_CATEGORY.LETTER };
        let file;
        if (format === 'markdown_file') {
          file = await uploadNominationFile({ ...base, fileName: `${title}.md`, mimeType: 'text/markdown' });
        } else {
          try {
            file = await uploadNominationFile({ ...base, fileName: title, mimeType: 'text/markdown', convertTo: GOOGLE_DOC_MIME_TYPE });
          } catch (error) {
            if (error instanceof NominationNotFoundError) throw error;
            // Fall back to a plain-text import if Drive won't convert markdown.
            file = await uploadNominationFile({ ...base, fileName: title, mimeType: 'text/plain', convertTo: GOOGLE_DOC_MIME_TYPE });
          }
        }
        logger.audit('MCP save_nomination_document', { user: user.email, id: nominationId, file: file.name });
        return { saved: { name: file.name, link: file.webViewLink } };
      })
  );

  server.registerTool(
    'upload_nomination_file',
    {
      title: 'Upload file to nomination',
      description:
        'Upload a binary file (PDF, DOCX, …) to the nomination’s Drive folder from base64 bytes. Only for clients that can read the original file’s bytes (e.g. Claude Code). If you only have the text of an attachment, use save_nomination_document instead, or ask the person to upload the file in the web app.',
      inputSchema: {
        nominationId: z.string(),
        fileName: z.string().min(1).describe('File name with extension, e.g. "nomination.pdf"'),
        contentBase64: z.string().min(1).describe('File bytes, base64-encoded (max 10 MB)'),
        mimeType: z.string().optional().describe('e.g. application/pdf'),
        category: fileCategory.optional(),
      },
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    ({ nominationId, fileName, contentBase64, mimeType, category }) =>
      run('upload_nomination_file', async () => {
        const buffer = Buffer.from(contentBase64, 'base64');
        if (buffer.length > 10 * 1024 * 1024) throw new NominationInputError('File is larger than 10 MB; upload it in the web app.');
        const file = await uploadNominationFile({
          nominationId,
          fileName,
          mimeType: mimeType || 'application/octet-stream',
          buffer,
          category: category || FILE_CATEGORY.OTHER,
        });
        logger.audit('MCP upload_nomination_file', { user: user.email, id: nominationId, file: file.name });
        return { uploaded: { name: file.name, link: file.webViewLink } };
      })
  );

  return server;
}
