# Award Nominations Management App

A comprehensive web application for managing academic award nominations, built with Next.js, shadcn/ui, and Google Sheets as a datastore. Designed for academic departments to track nominations, deadlines, and nomination package components across multiple years.

## Features

- **Awards Dashboard**: Browse and filter awards by division, deadline, career level, and more
- **Nomination Tracking**: Track nominees across years with status updates (pending, submitted, successful, unsuccessful)
- **Component Tracking**: Monitor progress on nomination letters, support letters, and documentation
- **Deadline Management**: View all award and nomination deadlines in one place
- **Google Sheets Integration**: Store all data in Google Sheets for easy access and collaboration
- **Responsive Design**: Beautiful UI built with shadcn/ui and Tailwind CSS

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
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

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
```

**Important Notes:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Found in your JSON key file as `client_email`
- `GOOGLE_PRIVATE_KEY`: Found in your JSON key file as `private_key` (keep the quotes and `\n` characters)
- `GOOGLE_SHEET_ID`: The long string in your Google Sheet URL between `/d/` and `/edit`
  - Example: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

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

### Awards Sheet
Stores all award information with 36+ fields covering eligibility, requirements, deadlines, and tracking.

### Nominations Sheet
Automatically created when you add your first nomination. Tracks:
- Candidate information
- Nomination status
- Letter and document progress
- Support letter tracking
- Important dates
- Notes

## File Attachments

Currently, the app tracks file metadata in Google Sheets. For actual file storage:
1. Upload nomination packages to Google Drive
2. Add file links in the nomination notes field
3. Future enhancement: Direct file upload integration

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
│   ├── api/              # API routes
│   │   ├── awards/       # Awards endpoints
│   │   └── nominations/  # Nominations endpoints
│   ├── awards/[id]/      # Award detail pages
│   ├── nominations/      # Nominations pages
│   │   └── [id]/         # Nomination detail pages
│   ├── deadlines/        # Deadlines page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── google-sheets.ts  # Google Sheets integration
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── .env.example          # Environment variables template
├── .env.local            # Your local environment variables (not committed)
├── components.json       # shadcn/ui configuration
├── netlify.toml          # Netlify configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

### Adding New Features

The codebase is modular and easy to extend:

- **New API endpoints**: Add to `app/api/`
- **New pages**: Add to `app/` directory
- **New UI components**: Add to `components/`
- **New data types**: Update `lib/types.ts` and `lib/google-sheets.ts`

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
