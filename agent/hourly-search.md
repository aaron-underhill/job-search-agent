# Hourly search agent

**Runs:** every hour at :01, as a Claude scheduled task (cron `1 * * * *`), on a smaller, faster model.
**Tools it has:** web search and fetch, Google Sheets, Gmail (read-only).
**Notifications:** its final message is pushed to the phone and emailed, but only when something qualifies (see Alerts).

Placeholders like `<SPREADSHEET_ID>` stand in for the real IDs.

---

Run the job-search skill's `search` command in unattended mode. If Gmail is connected, also run `status`. Follow the skill exactly: its filters, Hiring Likelihood Score and report format.

**Tracker:** use only the Google Sheet "Job Tracker" (tab "Jobs"), spreadsheet ID `<SPREADSHEET_ID>`. Read it first. Never create another tracker. Add new jobs as new rows at the bottom. For existing rows, only change Status, Date applied, Last update, Next action or Notes.

**No duplicates:** before adding a job, check the sheet for the same employer and title (or the same link). A job found again is not new: update its Last update instead of adding a row, and don't report it.

**Dates and times:** use Pacific time for every date, including dates read from emails. Write Date found as `'YYYY-MM-DD HH:MM` (leading apostrophe so Sheets keeps it as text), using this run's start time for every row added in this run, so each run's jobs share one timestamp. Other date columns are `'YYYY-MM-DD`.

**Posted column:** the dashboard's main page shows only jobs posted the same day they were found, so get the posting date right. Write it as `'YYYY-MM-DD` whenever the listing gives or implies an exact date. Convert relative dates: "just posted", "today", "N hours ago" → today; "yesterday" → yesterday; "N days ago" → today minus N. Put `~` in front only for real estimates ("about 2 weeks ago", "30+ days"). If there's no date anywhere, leave Posted blank and say "posted date unknown" in Notes. Never guess that a job was posted today.

**Gmail status check (read-only: never send, reply, label, archive or delete anything):**
- Match application emails (confirmations, assessment invites, interview requests, offers, rejections) to tracker rows by employer and job title.
- Mapping: confirmation → Acknowledged; assessment or screen → Assessment; interview → Interview; offer → Offer; rejection → Rejected. Never move a row backward. Set Date applied from the confirmation email when it's blank.
- If an email shows an application to a job that isn't on the tracker and fits the target roles, add it with Source "Gmail" and Notes "Added from Gmail; posting not scored". Skip job-alert emails; those aren't applications.

**Score format:** `NN (Band)`, e.g. `72 (Good)`. Leave Score blank only when the posting couldn't be read, and say so in Notes.

**Alerts** (the final message is pushed to the phone and emailed, so only make it an alert when something qualifies):
- A job qualifies only if all of these are true: it was added in this run; its Posted date is exactly today (no `~`, not blank); it scores 40 or higher; and it wasn't skipped.
- If any qualify, the first line is `NEW JOB POSTED TODAY: [n] match(es), best [highest score]`, then one line per job, highest first: `[score] ([band]) [title], [employer] · [pay] · [location] · [link]`, then the skill's short report.
- If an email moved an application to Assessment, Interview or Offer, add `STATUS: [employer] [title] -> [status] · [what to do and by when]`.
- Otherwise, record everything in the tracker as usual and end with only: `No new jobs posted today scoring 40+ since the last check.`
