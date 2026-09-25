/**
 * Command-line access to award nominations, for people (and Claude Code)
 * working from a clone of this repo. Reads and writes the same Google Sheet
 * and Drive folder as the web app, with the same validation.
 *
 * Usage: npm run nominations -- <command> [args]   (see `help` below)
 * Guide for Claude: .claude/skills/nominations/SKILL.md
 */
import { existsSync, readFileSync } from 'fs';
import { basename, extname } from 'path';
import { ZodError } from 'zod';
import type { NominationInputError } from '../lib/nomination-service';

// Load credentials before importing the Google modules, which read env at load time.
for (const file of ['.env.local', '.env']) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

const HELP = `Award nominations CLI

  npm run nominations -- <command> [args]

Commands:
  awards [search]                  List awards, optionally filtered by words in name/sponsor
  list [--award <awardId>] [--candidate <text>] [--year <year>] [--status <status>]
                                   List nominations
  get <nominationId>               Show one nomination, its award, and its uploaded files
  add <json-file | ->              Create a nomination from JSON (file path, or - for stdin)
  update <nominationId> <json-file | ->
                                   Change fields on a nomination (only the fields given)
  upload <nominationId> <file> [--category letter|support_letter|cv|publication|other]
                                   Upload a file to the nomination's Drive folder

Options:
  --dry-run   For add/update/upload: validate and print what would happen, change nothing
  --force     For add: create even if a matching nomination already exists

Output is JSON. Deleting nominations is only possible in the web app.`;

type Flags = Record<string, string | true>;

function parseArgs(argv: string[]): { positional: string[]; flags: Flags } {
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--') && !['dry-run', 'force'].includes(name)) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function flag(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

function print(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

function fail(message: string, details?: unknown): never {
  console.error(JSON.stringify({ error: message, ...(details ? { details } : {}) }, null, 2));
  process.exit(1);
}

function readJsonInput(source: string | undefined): unknown {
  if (!source) fail('Missing JSON input: pass a file path, or - to read stdin');
  const text = source === '-' ? readFileSync(0, 'utf8') : readFileSync(source, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${source === '-' ? 'stdin' : source}: ${(error as Error).message}`);
  }
}

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.rtf': 'application/rtf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  const dryRun = flags['dry-run'] === true;

  if (!command || command === 'help' || command === '--help') {
    console.log(HELP);
    return;
  }

  for (const name of ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEET_ID']) {
    if (!process.env[name]) {
      fail(`Missing ${name}. Put the app's Google credentials in .env.local (see .env.example).`);
    }
  }

  const service = await import('../lib/nomination-service');

  switch (command) {
    case 'awards': {
      print(await service.searchAwards(positional.join(' ')));
      return;
    }

    case 'list': {
      const year = flag(flags, 'year');
      print(
        await service.listNominations({
          awardId: flag(flags, 'award'),
          candidate: flag(flags, 'candidate'),
          year: year ? Number(year) : undefined,
          status: flag(flags, 'status'),
        })
      );
      return;
    }

    case 'get': {
      const id = positional[0];
      if (!id) fail('Usage: get <nominationId>');
      print(await service.getNominationDetails(id));
      return;
    }

    case 'add': {
      const input = readJsonInput(positional[0]);
      print(await service.createNomination(input, { dryRun, force: flags.force === true }));
      return;
    }

    case 'update': {
      const [id, source] = positional;
      if (!id) fail('Usage: update <nominationId> <json-file | ->');
      print(await service.updateNominationFields(id, readJsonInput(source), { dryRun }));
      return;
    }

    case 'upload': {
      const [id, path] = positional;
      if (!id || !path) fail('Usage: upload <nominationId> <file> [--category <category>]');
      if (!existsSync(path)) fail(`File not found: ${path}`);

      const { FILE_CATEGORY, VALIDATION_LIMITS } = await import('../lib/constants');
      const category = flag(flags, 'category') || FILE_CATEGORY.OTHER;
      if (!(Object.values(FILE_CATEGORY) as string[]).includes(category)) {
        fail(`Invalid category "${category}". Use one of: ${Object.values(FILE_CATEGORY).join(', ')}`);
      }

      const buffer = readFileSync(path);
      if (buffer.length > VALIDATION_LIMITS.MAX_FILE_SIZE) {
        fail(`File is larger than ${VALIDATION_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const { getNominationById } = await import('../lib/google-sheets');
      const nomination = await getNominationById(id);
      if (!nomination) fail(`Nomination not found: ${id}`);

      const fileName = basename(path);
      const mimeType = MIME_TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
      if (dryRun) {
        const { buildNominationFileName } = await import('../lib/nomination-files');
        print({
          dryRun: true,
          nominationId: id,
          candidateName: nomination.candidateName,
          wouldUpload: buildNominationFileName(fileName, category),
          mimeType,
          bytes: buffer.length,
        });
        return;
      }

      if (!process.env.GOOGLE_DRIVE_FOLDER_ID && !nomination.driveFolderId) {
        fail('Missing GOOGLE_DRIVE_FOLDER_ID in .env.local (needed to create the nomination folder).');
      }
      const { uploadNominationFile } = await import('../lib/nomination-files');
      const file = await uploadNominationFile({ nominationId: id, fileName, mimeType, buffer, category });
      print({ uploaded: { name: file.name, link: file.webViewLink } });
      return;
    }

    default:
      fail(`Unknown command "${command}". Run: npm run nominations -- help`);
  }
}

main().catch((error) => {
  // Checked by name: a static import of nomination-service would load the Google
  // modules before .env.local is read.
  if ((error as Error)?.name === 'NominationInputError') {
    fail(error.message, (error as NominationInputError).details);
  }
  if (error instanceof ZodError) {
    fail('Validation failed', error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  }
  fail((error as Error).message || String(error));
});
