# Award Nominations App

Next.js app for tracking award nominations. Data lives in a Google Sheet
(Awards and Nominations tabs) and a Google Drive folder; see `lib/google-sheets.ts`
and `lib/google-drive.ts`.

## Adding or updating nominations

When asked to add, find, or update a nomination (support letter writers,
status, uploading a draft letter, etc.), follow `.claude/skills/nominations/SKILL.md`
and use `npm run nominations`. Don't edit the Google Sheet directly.

## Development

- `npm run dev` — local server; `npx tsc --noEmit` — type check; `npm run lint`
- Nomination statuses are defined in `lib/types.ts`, `lib/constants.ts` and
  `lib/validation.ts` — keep all three in sync, plus the status dropdown and
  badges in `app/`.
- Deploys to OpenShift (`openshift/`); builds run from `main`.
