# OIDC Authentication Setup

This app uses University of Michigan OIDC authentication to restrict access to authorized users.

## Required Groups

Users must be a member of one of these groups to access the app:
- `Robotics Faculty`
- `robotics-staff`

## Environment Variables

Add these to your Netlify environment variables:

### UMich OIDC Credentials
```
UMICH_AWARDS_CLIENT_ID=your-client-id
UMICH_AWARDS_CLIENT_SECRET=your-client-secret
```

### Google Sheets/Drive
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID=your-spreadsheet-id
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
```

## How It Works

1. **Edge Function**: A Netlify Edge Function (`netlify/edge-functions/auth.ts`) runs on every request
2. **Authentication Check**:
   - If no token exists, user is redirected to UMich OIDC login
   - After login, checks if user is in required groups
   - If authorized, sets a secure cookie and allows access
   - If not authorized, shows access denied page
3. **Token Verification**: Existing tokens are verified on each request using JWKS
4. **Session Duration**: Tokens expire after 8 hours (28800 seconds)

## OIDC Flow

```
User visits site
    ↓
No token? → Redirect to UMich login
    ↓
User authenticates
    ↓
Callback to /auth/callback
    ↓
Exchange code for token
    ↓
Get user info & check groups
    ↓
Groups match? → Set cookie → Allow access
    ↓
Groups don't match? → Access denied page
```

## Callback URL

The callback URL is automatically constructed as:
```
https://your-domain.netlify.app/auth/callback
```

Make sure this URL is registered in your UMich OIDC client configuration.

## Development Mode

Set `NODE_ENV=development` to bypass authentication during local development.

## Testing Access

To test the authentication:
1. Visit the deployed site
2. You should be redirected to UMich login
3. After authentication, you'll either:
   - See the app (if in required groups)
   - See access denied page (if not in required groups)

## Troubleshooting

Check Netlify Edge Function logs for authentication issues:
- Token exchange failures
- Group membership checks
- Token verification errors

Common issues:
- **403 on callback**: Client ID/Secret mismatch
- **Access denied after login**: User not in required groups
- **Infinite redirect loop**: Token verification failing (check JWKS endpoint)
