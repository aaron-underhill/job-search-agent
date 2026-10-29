# Private Google Sheets API (early, server-only foundation)

The endpoint `GET /api/jobs` reads the existing Google Sheet on the server. It is **not connected to the browser dashboard yet** and is intentionally inaccessible without a bearer token. It is a temporary machine-to-machine integration step, **not user login**.

## Mandatory protection

First, in Vercel's project **Security → Deployment Protection**, set **Vercel Authentication → All Deployments**. Vercel announced free production protection on all plans in September 2026. Do not publish personal data until the production URL is protected. Keep production secrets only in Vercel's environment variables.

Set these variables in your Vercel project:

- `PRIVATE_API_TOKEN`: a unique, randomly generated 32+ character secret for manual authenticated API testing. Treat as a password; never put it in HTML, JavaScript, GitHub or screenshots.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: service account email from your own Google Cloud project.
- `GOOGLE_PRIVATE_KEY`: corresponding PEM private key, with newline escapes if entering it on one line.
- `GOOGLE_SHEET_ID`: the spreadsheet ID of the **actual private** Job Tracker.
- `GOOGLE_JOBS_RANGE`: optional; defaults to `Jobs!A1:O500`.

Enable the Google Sheets API in your Google Cloud project and share the actual Sheet **only** with the service account email as Viewer (read-only). Do not make the Sheet publicly accessible. Do not paste your service-account JSON or token into chat. Rotate credentials if they are exposed.

## Current limitations

- The endpoint requires an `Authorization: Bearer <PRIVATE_API_TOKEN>` header. It cannot safely be called directly from static frontend code: that would leak the token to every visitor.
- It returns spreadsheet rows as objects keyed by the header row, preserving the original private schema. It doesn't yet connect to the existing Claude dashboard data adapter.
- The real dashboard must remain **disabled for private data** until an actual interactive login/session solution is implemented. Vercel deployment protection alone is not a substitute for route-level authorization for future shareable public deployments.
- No write operations, OAuth login UI, real agent runs, or job-search scheduler are implemented.
- The API rejects requests unless the server secret is set, and returns an unavailable error if Google credentials are missing. Avoid printing tokens or full private records to logs.

After changing environment variables redeploy from Vercel. For server-to-server testing, send the bearer token from a trusted local command-line client, not from your browser.
