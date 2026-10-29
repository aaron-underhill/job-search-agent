# Job ingestion: current scope and next steps

`lib/jobs/normalize.js` provides a provider-agnostic transformation of untrusted source postings into a common job schema, with URL normalization and exact URL deduplication.

This is **not** a scraper, live data feed, URL reachability check, or verification of posting legitimacy.

## Pipeline (target)

1. Obtain listings from approved sources and legitimate public posting URLs.
2. Apply input validation and exact canonical-URL deduplication.
3. Verify that job details and URLs remain current, tracking `verifiedAt` and uncertainty; a URL being syntactically valid is **not** verification.
4. Apply applicant-specific hard constraints and deterministic filters.
5. Evaluate promising jobs with `lib/ai/score.js`.
6. Store normalized listings and evaluations via authenticated server-side storage.
7. Display real data only after authentication is implemented for the entire dashboard.

No private applicant profile, access keys, or personal job data are stored in this public repository. No production ingestion endpoint has been enabled.

Run unit tests with `npm test`.
