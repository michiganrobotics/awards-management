# Award Nominations Management App

A comprehensive web application for managing academic award nominations, built with Next.js, shadcn/ui, and Google Sheets as a datastore. Designed for academic departments to track nominations, deadlines, and nomination package components across multiple years.

## Features

### Core Features
- **Awards Dashboard**: Browse and filter awards by division, deadline, career level, priority ranking, and more
- **Advanced Search**: Full-text search across award names, sponsors, descriptions, and disciplines
- **Nomination Management**: Create and track nominations for candidates across multiple years
- **Candidates View**: Unified view of all candidates with their complete nomination history
- **File Management**: Upload and organize nomination documents using Google Drive integration
- **Support Letters Tracking**: Track multiple support letters per nomination with status indicators
- **Letter Writing Progress**: Monitor nomination letter progress (not started, requested, in progress, completed)
- **Status Workflow**: Track nominations through their lifecycle (pending, submitted, successful, unsuccessful)

### Additional Capabilities
- **Real-time Statistics**: Dashboard showing total nominations, pending, submitted, and successful counts
- **Deadline Sorting**: Intelligent parsing and sorting of award deadlines (handles dates, rolling deadlines, etc.)
- **Organized File Storage**: Automatic folder creation in Google Drive for each nomination
- **Multi-year History**: Track and compare nominations across different years
- **Responsive Design**: Mobile-friendly UI built with shadcn/ui and Tailwind CSS
- **Google Sheets Integration**: All data stored in Google Sheets for easy access and collaboration
- **Secure UUID-based IDs**: Cryptographically secure unique identifiers for all records

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Google Sheets API
- **Deployment**: Netlify
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Google Cloud Platform account
- Google Sheets spreadsheet

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd award-nominations-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Sheets

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the required APIs:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and click "Enable"
   - Search for "Google Drive API" and click "Enable"

#### Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details and click "Create"
4. Skip granting access and click "Done"
5. Click on the service account you just created
6. Go to the "Keys" tab
7. Click "Add Key" > "Create New Key"
8. Select "JSON" and click "Create"
9. Save the downloaded JSON file securely

#### Prepare Your Google Sheet

1. Create a new Google Sheet or use an existing one
2. Create a sheet named "Awards" with the following columns (or import your existing CSV):
   - Award or Prize
   - Sponsor
   - Link and/or more info
   - Division
   - Deadline Month
   - Monetary Amount
   - Description
   - Field or Discipline
   - Call for Noms
   - Priority Ranking
   - Added from
   - Type of Impact
   - Award Type
   - Academic Career Level
   - Reason(s) to remove or not promote
   - Limited
   - Nominator
   - Nomination Viability
   - Self nominations
   - Confidential
   - Currently managed by
   - Notes
   - To be managed by
   - MIT paper
   - Nomination request from?
   - Logo
   - Nominations
   - Award Rotation
   - Award Analysis
   - Heritage Award?
   - Faculty
   - Faculty 2
   - Faculty 3
   - Candidate Suggestions 2024
   - Candidate Suggestions
   - Suggested Candidate (from Candidate Suggestions)

3. Share the spreadsheet with your service account email:
   - Click "Share" in your Google Sheet
   - Paste the service account email (found in the JSON file as `client_email`)
   - Give "Editor" access

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id-from-url
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

**Important Notes:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Found in your JSON key file as `client_email`
- `GOOGLE_PRIVATE_KEY`: Found in your JSON key file as `private_key` (keep the quotes and `\n` characters)
- `GOOGLE_SHEET_ID`: The long string in your Google Sheet URL between `/d/` and `/edit`
  - Example: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
- `GOOGLE_DRIVE_FOLDER_ID`: The folder ID where nomination files will be stored
  - Found in the Google Drive folder URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
  - Share this folder with your service account email with "Editor" permissions

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Netlify

### Option 1: Deploy via Netlify UI

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "Add new site" > "Import an existing project"
4. Connect your GitHub repository
5. Netlify will auto-detect the build settings
6. Add your environment variables in Site Settings > Environment Variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_DRIVE_FOLDER_ID`
7. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

Set environment variables:
```bash
netlify env:set GOOGLE_SERVICE_ACCOUNT_EMAIL "your-email@..."
netlify env:set GOOGLE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----..."
netlify env:set GOOGLE_SHEET_ID "your-sheet-id"
netlify env:set GOOGLE_DRIVE_FOLDER_ID "your-folder-id"
```

## Usage Guide

### Dashboard

The main dashboard shows:
- Total awards count
- High priority awards
- Upcoming deadlines
- Search and filter functionality
- Awards table with key information

### Award Details

Click on any award to view:
- Complete award information
- Eligibility requirements
- Nomination history for that award
- Add new nominations
- Track nomination status

### Managing Nominations

For each nomination, you can:
- Update candidate information
- Set deadlines and submission dates
- Track nomination letter status (not started, in progress, completed)
- Track support letters status (not started, requested, received)
- Add notes and links to nomination package files
- Update overall nomination status (pending, submitted, successful, unsuccessful)

### Deadlines View

View all deadlines in one place:
- Call for nominations deadlines (from awards)
- Individual nomination deadlines
- Filter upcoming deadlines
- Quick links to awards and nominations

## Data Structure

The application uses two main Google Sheets to store all data:

### Awards Sheet
The Awards sheet stores comprehensive information about each award with the following fields:

**Core Information:**
- `awardId` - Unique identifier (UUID-based)
- `Award or Prize` - Name of the award
- `Sponsor` - Organization or entity sponsoring the award
- `Link and/or more info` - URL to award information
- `Description` - Detailed description of the award
- `Logo` - Award logo or image URL

**Eligibility & Requirements:**
- `Division` - Academic division or department
- `Field or Discipline` - Relevant academic fields
- `Academic Career Level` - Early Career, Mid-Career, Late Career
- `Award Type` - Category or type of award
- `Type of Impact` - Expected impact or focus area
- `Limited` - Whether award has limited slots
- `Self nominations` - Whether self-nominations are allowed
- `Confidential` - Confidentiality requirements

**Deadlines & Planning:**
- `Deadline` - Submission deadline (supports dates like "10/15" or text like "Rolling")
- `Call Start Date` - When call for nominations opens
- `Award Rotation` - Rotation schedule if applicable

**Tracking & Management:**
- `Priority Ranking` - Internal priority level
- `Nomination Viability` - Assessment of nomination feasibility
- `Nominator` - Who can nominate
- `Currently managed by` - Current manager
- `To be managed by` - Planned manager
- `Notes` - Additional notes and comments

**Analysis & History:**
- `Award Analysis` - Strategic analysis
- `Monetary Amount` - Prize amount
- `Heritage Award?` - Historical significance flag
- `Faculty` / `Faculty 2` / `Faculty 3` - Faculty member tracking
- `Candidate Suggestions` / `Candidate Suggestions 2024` - Potential nominees
- `Suggested Candidate (from Candidate Suggestions)` - Selected suggestions

**Administrative:**
- `Reason(s) to remove or not promote` - Decision tracking
- `Added from` - Source of award information
- `MIT paper` - Related documentation
- `Nomination request from?` - Request tracking

### Nominations Sheet
The Nominations sheet is automatically created when you add your first nomination. Each nomination includes:

**Identification:**
- `id` - Unique nomination identifier (UUID-based)
- `awardId` - Reference to the award
- `candidateName` - Name of the nominee
- `nominationYear` - Year of nomination (e.g., 2025)

**Status Tracking:**
- `status` - Overall status: `pending`, `submitted`, `successful`, or `unsuccessful`
- `letterStatus` - Nomination letter status: `not_started`, `requested`, `in_progress`, or `completed`
- `supportLettersStatus` - Support letters status: `not_started`, `requested`, or `received`

**Letter Management:**
- `letterWriterName` - Name of the person writing the nomination letter
- `letterWriterContact` - Contact information for letter writer
- `supportLetters` - JSON array of support letter objects containing:
  - `name` - Letter writer's name
  - `contact` - Letter writer's contact
  - `status` - Letter status (`not_started`, `requested`, or `received`)
- `supportLettersCount` - Total number of support letters

**File Management:**
- `driveFolderId` - Google Drive folder ID for this nomination's files
- `packageFiles` - JSON array of file IDs stored in Google Drive

**Dates & Timeline:**
- `deadlineDate` - Nomination deadline (ISO date format)
- `submissionDate` - Date when nomination was submitted (ISO date format)
- `createdAt` - When the nomination record was created (ISO timestamp)
- `updatedAt` - When the nomination was last modified (ISO timestamp)

**Additional Information:**
- `nominatedBy` - Person who nominated the candidate
- `notes` - Free-form notes and comments

### TypeScript Data Models

The application uses strongly-typed interfaces for data validation:

```typescript
interface Award {
  id: string;
  awardOrPrize: string;
  sponsor: string;
  link: string;
  division: string;
  deadlineMonth: string;
  monetaryAmount: string;
  description: string;
  fieldOrDiscipline: string;
  callStartDate: string;
  priorityRanking: string;
  // ... and more fields
}

interface Nomination {
  id: string;
  awardId: string;
  candidateName: string;
  nominatedBy: string;
  nominationYear: number;
  status: 'pending' | 'submitted' | 'successful' | 'unsuccessful';
  letterStatus: 'not_started' | 'requested' | 'in_progress' | 'completed';
  supportLettersStatus: 'not_started' | 'requested' | 'received';
  driveFolderId?: string;
  deadlineDate?: string;
  submissionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportLetter {
  name: string;
  contact: string;
  status: 'not_started' | 'requested' | 'received';
}
```

## File Management & Google Drive Integration

The application features full Google Drive integration for managing nomination files:

**Automated Folder Organization:**
- Each nomination automatically gets its own folder in Google Drive
- Folders are organized within a parent folder specified by `GOOGLE_DRIVE_FOLDER_ID`
- Folder IDs are stored in the `driveFolderId` field of each nomination

**File Upload & Storage:**
- Direct file upload from the nomination detail page
- Files can be categorized as: letter, support_letter, cv, publication, or other
- Supports files up to 50MB in size
- File metadata (ID, name, size, type, links) stored in Google Drive
- File references stored in nomination's `packageFiles` array

**File Operations:**
- Upload files directly to nomination folders
- View and download files through web links
- Delete files when no longer needed
- List all files associated with a nomination

**Shared Drive Support:**
- Full support for Google Shared Drives (Team Drives)
- Automatic detection and handling of shared drive permissions
- Safe file operations with proper error handling

## Troubleshooting

### Google Sheets API Errors

**Error: "Missing Google Sheets credentials"**
- Check that all environment variables are set correctly
- Ensure the private key includes `\n` characters

**Error: "The caller does not have permission"**
- Verify you've shared the Google Sheet with the service account email
- Check that the service account has "Editor" access

**Error: "Unable to parse range"**
- Make sure your sheet has the correct header row
- Verify the sheet is named "Awards"

### Build Errors

If you encounter build errors:
1. Delete `.next` folder: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run build`

## Development

### Project Structure

```
award-nominations-app/
├── app/
│   ├── api/                      # API routes
│   │   ├── awards/               # Awards CRUD endpoints
│   │   │   └── route.ts
│   │   ├── nominations/          # Nominations CRUD endpoints
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── files/                # File management endpoints
│   │       ├── upload/route.ts
│   │       └── [nominationId]/route.ts
│   ├── awards/[id]/              # Award detail & nomination creation
│   │   └── page.tsx
│   ├── nominations/              # All nominations view
│   │   ├── page.tsx
│   │   └── [id]/page.tsx         # Nomination detail & file management
│   ├── candidates/               # Candidates & nomination history
│   │   └── page.tsx
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout with metadata
│   ├── icon.svg                  # App icon
│   └── page.tsx                  # Main dashboard
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   └── file-upload.tsx           # Custom file upload component
├── lib/
│   ├── google-sheets.ts          # Google Sheets integration
│   ├── google-drive.ts           # Google Drive integration
│   ├── types.ts                  # TypeScript interfaces
│   ├── constants.ts              # App constants & column mappings
│   ├── validation.ts             # Input validation functions
│   ├── auth.ts                   # Authentication utilities
│   ├── api-utils.ts              # API helper functions
│   └── utils.ts                  # General utility functions
├── netlify/
│   └── edge-functions/           # Netlify Edge Functions
│       ├── auth.ts               # Edge authentication
│       └── import_map.json
├── public/                       # Static assets
│   ├── next.svg
│   ├── vercel.svg
│   └── ...
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment variables (gitignored)
├── components.json               # shadcn/ui configuration
├── netlify.toml                  # Netlify deployment config
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── OIDC_SETUP.md                 # OIDC authentication guide
└── README.md                     # This file
```

### Application Pages

The app includes several interconnected pages:

1. **Dashboard (`/`)** - Main landing page
   - Search and filter awards
   - View awards table with key information
   - Sort by deadline
   - Quick navigation to Awards, Nominations, and Candidates
   - Statistics: total awards, high priority awards, upcoming deadlines

2. **Award Detail (`/awards/[id]`)** - Individual award page
   - Complete award information
   - Eligibility requirements and deadlines
   - List of all nominations for this award
   - Add new nominations
   - Track nomination status and progress

3. **Nominations List (`/nominations`)** - All nominations overview
   - View all nominations grouped by year
   - Statistics dashboard (total, pending, submitted, successful)
   - Quick status overview
   - Links to individual nomination details

4. **Nomination Detail (`/nominations/[id]`)** - Individual nomination management
   - Update candidate information
   - Manage nomination letter (writer, status)
   - Track support letters (add multiple, update status)
   - Upload and manage files (nomination package, letters, CV, etc.)
   - Set deadlines and submission dates
   - Update overall nomination status
   - Add notes

5. **Candidates (`/candidates`)** - Candidate-centric view
   - See all candidates with their nomination history
   - View multiple nominations per candidate
   - Track success rates
   - Search by candidate name or award
   - Statistics: total candidates, nominations, success rate

### Adding New Features

The codebase is modular and easy to extend:

**Backend (API Routes):**
- Add new endpoints in `app/api/[endpoint]/route.ts`
- Use existing Google Sheets/Drive utilities from `lib/`
- Follow existing patterns for error handling and validation
- Add new data operations to `lib/google-sheets.ts` or `lib/google-drive.ts`

**Frontend (Pages & Components):**
- Create new pages in `app/[pagename]/page.tsx`
- Use shadcn/ui components from `components/ui/`
- Follow responsive design patterns with Tailwind CSS
- Add reusable components to `components/`

**Data Layer:**
- Define new TypeScript interfaces in `lib/types.ts`
- Add new constants to `lib/constants.ts`
- Update Google Sheets column mappings if needed
- Add validation rules to `lib/validation.ts`

**Authentication & Security:**
- OIDC authentication setup documented in `OIDC_SETUP.md`
- Edge functions for auth in `netlify/edge-functions/auth.ts`
- Input validation and sanitization throughout
- Secure UUID-based IDs for all records

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your academic department!

## Support

For issues and questions:
- Check the Troubleshooting section
- Review Google Sheets API documentation
- Open an issue in the GitHub repository

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Lucide Icons](https://lucide.dev/)
