# Vercel deployment and private application roadmap

## What is deployable now

This public repository contains a **fictional demo**. The dashboard loads `demo/demo-data.js` to mimic the private Claude runtime. Deploying this repository does **not** deploy the real job-search workflow, private Google Sheet or personal application data.

### Deploy the public demo
1. Import `aaron-underhill/job-search-agent` from GitHub into Vercel.
2. Choose the **Other** framework preset; use the repository root, no build command, and publish the existing static `index.html`.
3. Deploy; `GET /api/health` returns `mode: demo` to indicate the private backend is *not* configured.

## Private application (not implemented yet)

1. Add server-side authentication and check it on *every* route serving personal data or accepting job actions. A hidden URL is not authentication.
2. Create same-origin backend API routes for Google Sheets access and OpenAI requests. Keep OAuth tokens, service-account credentials and `OPENAI_API_KEY` on the server, never in client JavaScript.
3. Implement a validated `GET /api/jobs` endpoint with pagination and error handling, then connect the live frontend to it behind authentication.
4. Move discovery, scoring, tailoring and revisions to server-side workers/handlers. Verify sources, deduplicate job links, use deterministic filters first, and retain human approval of every application.
5. Trigger scheduled searches using a scheduler, not a permanently-running Vercel process. Add idempotency, logging without private data, retry behavior, and a model budget.
6. Test unauthorized access, request forgery protection for mutations, secret handling, mobile layout, and full end-to-end operation.

Use a heuristic **fit score**, not an empirically calibrated probability of being hired.

## Secret handling

No secrets are necessary for the demo. Configure production credentials as host-managed environment variables only, and do not commit `.env`, personal profiles, actual resumes, job records, OAuth refresh tokens, or API keys.

## Status

- [x] Public demo foundation with non-sensitive health endpoint
- [ ] Authenticated private backend
- [ ] Google Sheet integration
- [ ] OpenAI agent integration
- [ ] Scheduled search
- [ ] Production deployment and phone testing
