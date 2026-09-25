---
name: nominations
description: Add, look up, or update award nominations in the awards app (Google Sheet + Drive backend), including support letter writers and uploading draft letters or other files. Use when someone asks to add a nomination for an award, record support letter writers, change a nomination's status, upload a nomination draft/CV, or asks what nominations exist for an award or candidate.
---

# Managing award nominations

All reads and writes go through `npm run nominations -- <command>`
(`scripts/nominations.ts`). It uses the same Google Sheet, Drive folder and
validation as the web app, so anything it creates shows up in the app right away.
**Never edit the Google Sheet directly** — the script fills in IDs, timestamps
and JSON columns the app depends on.

Every command prints JSON. Errors print `{ "error": ..., "details": ... }` and exit 1.

## Setup (once per clone)

1. `npm install`
2. Create `.env.local` in the repo root with the app's Google credentials
   (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`,
   `GOOGLE_DRIVE_FOLDER_ID` — see `.env.example`). Get these from the app's
   maintainer. `.env.local` is gitignored; never commit it or paste it anywhere.
3. Check it works: `npm run nominations -- awards` should list awards.

If a command says credentials are missing, stop and tell the user — don't go
looking for keys elsewhere.

## Commands

| Command | What it does |
|---|---|
| `awards [words]` | Awards whose name/sponsor contain all the words |
| `list [--award ID] [--candidate TEXT] [--year N] [--status S]` | Nominations, filtered |
| `get ID` | One nomination, its award, and its uploaded files |
| `add FILE` or `add -` (stdin) | Create a nomination from JSON |
| `update ID FILE` or `update ID -` | Change only the given fields |
| `upload ID PATH [--category C]` | Upload a file to the nomination's Drive folder |

Add `--dry-run` to `add`, `update` or `upload` to validate and preview without
changing anything. `add` refuses to create a second nomination for the same
candidate + award + year unless given `--force` (usually you want `update`).
Deleting is deliberately not supported here — send the user to the web app.

## Workflow: "add a nomination for X award, here's the draft, these people are writing support letters"

1. **Find the award.** `npm run nominations -- awards <a few distinctive words>`.
   If there are several matches or none, show the candidates and ask the user
   which one — never guess an `awardId`.
2. **Check it doesn't exist already.**
   `npm run nominations -- list --award <awardId> --candidate "<name>"`.
   If it does, switch to `update` on that nomination.
3. **Fill the gaps before writing.** Required: `candidateName`, `nominatedBy`
   (the person nominating — ask if not stated), `nominationYear` (the award
   cycle; ask if it isn't obvious from the deadline). Ask for support letter
   writers' contact info if not given; leave `contact` as `""` if the user
   doesn't have it.
4. **Build the JSON** (see fields below) and preview it:
   `npm run nominations -- add - --dry-run <<'EOF' ... EOF`.
   Show the user a short summary (award, candidate, nominator, year, support
   writers, status) and get a yes before creating it.
5. **Create it:** same command without `--dry-run`. Note the returned `created.id`.
6. **Upload files** the user gave you:
   `npm run nominations -- upload <id> <path> --category letter` for the
   nomination letter/draft; `support_letter`, `cv`, `publication` or `other`
   for the rest. Upload the user's original file (PDF/DOCX) rather than a
   re-typed copy. If the draft was pasted as text, save it to a `.md` or `.txt`
   file in a scratch directory first — not inside the repo.
7. **Report back:** the nomination id, what was recorded, and the file links
   from `upload`.

### Example

```bash
npm run nominations -- add - --dry-run <<'EOF'
{
  "awardId": "award-3f1c...",
  "candidateName": "Jane Doe",
  "nominatedBy": "Alex Rivera",
  "nominationYear": 2026,
  "status": "pending",
  "letterStatus": "in_progress",
  "letterWriterName": "Alex Rivera",
  "letterWriterContact": "arivera@umich.edu",
  "supportLettersStatus": "requested",
  "supportLetters": [
    { "name": "Ann Smith", "contact": "asmith@mit.edu", "status": "requested" },
    { "name": "Bo Lee", "contact": "", "status": "not_started" }
  ],
  "deadlineDate": "2026-11-15",
  "notes": "Draft letter uploaded 2026-09-25."
}
EOF
```

## Fields

| Field | Values / notes |
|---|---|
| `awardId` | From `awards`. Required. Can't be changed later. |
| `candidateName` | Required, ≤ 200 chars |
| `nominatedBy` | Required |
| `nominationYear` | Required, integer year |
| `status` | `pending` (default), `submitted`, `successful`, `unsuccessful`, `ineligible`, `did_not_apply` |
| `letterStatus` | Main nomination letter: `not_started` (default), `requested`, `in_progress`, `completed`. A draft exists → `in_progress`. |
| `letterWriterName`, `letterWriterContact` | Who writes the main letter (often the nominator) |
| `supportLetters` | Up to 5 of `{ "name", "contact", "status" }`, status `not_started` / `requested` / `received` |
| `supportLettersStatus` | Overall: `not_started` (default), `requested`, `received` |
| `deadlineDate`, `submissionDate` | `YYYY-MM-DD` |
| `notes` | Free text, ≤ 5000 chars |

`supportLettersCount` is filled in from `supportLetters` automatically.

When updating `supportLetters`, send the **whole list** (fetch it with `get`
first, then add/change entries) — the field is replaced, not merged.

Use exact lowercase values; "Submitted" or "did not apply" will be rejected.
