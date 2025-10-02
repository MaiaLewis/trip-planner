This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication Setup (NextAuth + Google)

This app uses NextAuth with Google OAuth to obtain a user access token for Google Drive/Sheets API calls.

1. Create a Google Cloud project (or use an existing one) in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the following APIs:
   - Google Drive API
   - Google Sheets API
3. Create OAuth 2.0 credentials (type: Web application) under APIs & Services → Credentials.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Copy your Client ID and Client Secret.
5. Create a `.env.local` file at the project root based on `.env.local.example`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-strong-random-string
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

6. Restart the dev server after adding env vars.

If you see `?error=OAuthSignin`, it usually means one of these is misconfigured:
- Missing or incorrect `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars
- Missing `NEXTAUTH_URL` or it does not match the running origin
- Redirect URI not added in Google console: must be `http://localhost:3000/api/auth/callback/google`
- Missing `NEXTAUTH_SECRET`

After signing in, you should be redirected to `/trips`. The app requests scopes for Drive and Sheets in `src/app/api/auth/[...nextauth]/route.js` so you can create and edit spreadsheets within your Google account.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
