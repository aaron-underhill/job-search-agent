/* Demo mode for the job board.

   The live board runs as a claude.ai artifact. There it gets a small runtime, window.claude, that lets the page
   call the owner's connected apps (Google Sheets, Google Drive, Gmail) and start Claude scheduled tasks.
   This file provides a stand-in for that runtime so the same page can run anywhere with sample data:

   - "Google Sheets": an in-memory Job Tracker (tab "Jobs") and Applications tab, built fresh on every load
     with dates relative to now, so "Posted today" always has something in it.
   - "Claude Code Remote" fire_trigger: simulates the tailoring and revision agents. In the live version these
     are scheduled tasks that research the employer and rewrite the resume and cover letter (a few minutes);
     here they fill the template with prepared text after a few seconds.
   - "Gmail" search_threads: returns a few prepared emails for jobs that were applied to.
   - downloads.save: a normal browser download.

   Everyone in the demo is fictional: the applicant, the employers and the job postings. Reloading resets it. */
(function () {
  "use strict";

  // ---------- persona-specific settings the page reads ----------
  window.BOARD_CONFIG = {
    brand: "Job Search Agent",
    tagline: "Demo: a fictional line cook's search in Portland, scored by an AI agent",
    filePrefix: "Jordan_Avery",
    templateNames: {
      "Line / station cook": "Line / station cook",
      "Sous chef / kitchen lead": "Sous chef / kitchen lead",
      "Catering / institutional": "Catering / institutional",
    },
    gapTerms: [
      ["Fine dining / tasting menu", /fine.dining|tasting menu/i],
      ["Pastry / lamination", /pastry|laminat|viennoiserie/i],
      ["Whole-animal butchery", /butcher/i],
      ["Banquet volume (500+ covers)", /banquet/i],
      ["Ordering / vendor management", /ordering|vendor/i],
      ["ServSafe Manager", /servsafe manager/i],
      ["Wood-fired oven", /wood.fired/i],
      ["Raw bar / whole fish", /raw bar|whole.fish|oyster/i],
      ["Diet orders / institutional", /diet order|institutional/i],
      ["Car or driving", /\bcar\b|driving|driver/i],
    ],
    freshenExample: "e.g. Put the pop-up dinners first and mention brunch volume in the summary",
    suggestions: ["Shorten the cover letter", "Make the summary more specific to this job", "Lead with my prep and inventory work",
      "Mention the stations this posting needs where they're true for me", "Warmer, less formal tone in the cover letter"],
  };

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  // The "latest" hourly search ran at :01 this hour (or a minute ago, just after a new hour starts).
  let lastRun = new Date(now); lastRun.setMinutes(1, 0, 0);
  if (lastRun > now) lastRun = new Date(now.getTime() - 60000);
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysAgo = (n) => new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() - n);
  const stamp = (d) => `${dayISO(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  // A search run n hours before the latest one, but never earlier than 00:01 today when it's for a job posted today.
  function runAt(hoursBefore, postedDaysAgo) {
    let d = new Date(lastRun.getTime() - hoursBefore * 3600000);
    if (postedDaysAgo === 0 && d < day0) d = new Date(day0.getTime() + 60000);
    if (postedDaysAgo > 0) { const p = daysAgo(postedDaysAgo); d = new Date(p.getFullYear(), p.getMonth(), p.getDate(), 9 + (postedDaysAgo % 9), 1); }
    return d;
  }

  // ---------- sample jobs (all fictional) ----------
  // [score, band, title, employer, pay, location, source, template, postedDaysAgo (null = no exact date), hoursBeforeLastRun, status, appliedDaysAgo, notes, why]
  const L = "Line / station cook", S = "Sous chef / kitchen lead", C = "Catering / institutional";
  const JOBS = [
    [84, "Strong", "Line Cook", "Alder & Ash", "$22–25/hr + tips", "Pearl District (Streetcar NS line)", "Indeed", L, 0, 0, "Found", null,
      "Meets every requirement (2+ years on a line, sauté and grill). Weekend nights required, which fits.",
      "Alder & Ash cooks over a wood-and-charcoal hearth with produce from farms in the Willamette Valley, and its menu changes every few weeks. I'd like to learn live-fire cooking in a kitchen that cares this much about where its food comes from."],
    [66, "Good", "Sous Chef", "Juniper Table", "$24–27/hr", "Alberta Arts District (bus 72)", "Culinary Agents", S, 0, 0, "Found", null,
      "Meets the requirements. No vendor ordering experience yet (preferred); popular brunch spot, so expect competition.",
      "Juniper Table's brunch is one of the busiest in Northeast Portland, and the kitchen is known for promoting from within. That kind of place is where I'd like to grow into a sous chef."],
    [47, "Possible", "Pastry Cook", "Northwest Bread Works", "$21/hr", "Slabtown (Streetcar NS line)", "Indeed", L, 0, 0, "Found", null,
      "One real gap: laminated dough and pastry experience is required, and Jordan's pastry work is limited to brunch prep.", ""],
    [23, "Long shot", "Chef de Partie", "Saltgrass Oyster Bar", "$23–26/hr", "Downtown", "Poached", L, 0, 0, "Found", null,
      "Asks for 3 years of fine dining and raw bar work, including whole-fish breakdown. Jordan has neither yet.", ""],
    [null, "", "Executive Chef", "Copper Pot Bistro", "$75,000/yr", "Hawthorne", "Indeed", S, 0, 0, "Skipped", null,
      "Skipped: Executive Chef is above the level this search targets.", ""],
    [71, "Good", "Prep Cook", "Riverbend Market Co-op", "$21.50/hr", "Hawthorne (bus 14)", "Co-op careers page", C, 0, 3, "Ready to apply", null,
      "Meets every requirement. Morning shifts; the deli kitchen does batch soups and salads.",
      "Riverbend is a member-owned grocery that buys from more than 60 local farms, and its deli cooks from scratch every morning. I'd like my cooking to support local growers, and scratch batch cooking is work I already do."],
    [79, "Good", "Catering Cook", "Lantern Hall Catering", "$23/hr", "Central Eastside (bus 6)", "Indeed", C, 2, 0, "Applied", 1,
      "Meets the requirements. Event days run long; batch cooking volunteer work is a strong match.",
      "Lantern Hall caters weddings and nonprofit events across Portland and is known for cooking everything in its own kitchen. I'd enjoy the planning that goes into a 200-person event."],
    [62, "Good", "Line Cook", "Ferro Kitchen", "$20–23/hr + tips", "Downtown", "Culinary Agents", L, 4, 0, "Acknowledged", 3,
      "Meets the requirements. Pasta station experience preferred (he has none); very busy pre-theater rush.", ""],
    [55, "Possible", "Kitchen Lead", "Rosewood Hospital Food Services", "$24/hr", "Marquam Hill (tram / bus 8)", "Hospital careers page", C, 3, 0, "Found", null,
      "One gap: diet orders and institutional cooking experience preferred, and ServSafe Manager is required within 90 days (can be earned on the job).", ""],
    [38, "Long shot", "Banquet Cook", "Pine Street Hotel", "$22/hr", "Downtown", "Hotel careers page", C, 5, 0, "Found", null,
      "Several gaps: banquet experience with 500+ covers required; no banquet work so far.", ""],
    [12, "Unlikely", "Butcher", "Tilth & Cleaver", "$24/hr", "Kenton (MAX Yellow Line)", "Indeed", L, 6, 0, "Found", null,
      "Requires 3 years of whole-animal butchery. Skip.", ""],
    [74, "Good", "Breakfast Cook", "Green Fern Café", "$21/hr + tips", "Sellwood (bus 19)", "Indeed", L, 6, 0, "Interview", 5,
      "Meets every requirement; flat-top brunch experience is a direct match.",
      "Green Fern has served Sellwood's breakfast crowd for twenty years and still makes its biscuits and jam in house. I ran the flat-top through weekend brunch for two years and would love to do that for a neighborhood place like this."],
    [70, "Good", "Deli Cook", "Portside Grocery", "$21.75/hr", "St. Johns (bus 4)", "Company careers page", C, 7, 0, "Assessment", 4,
      "Meets the requirements. Online skills questionnaire is part of the process.", ""],
    [81, "Strong", "Line Cook", "Marrow & Vine", "$22–24/hr + tips", "Buckman (bus 15)", "Culinary Agents", L, 12, 0, "Applied", 11,
      "Meets every requirement; sauté-focused menu matches Jordan's station.", ""],
    [68, "Good", "Cook II", "Willamette Senior Living", "$22/hr", "Sellwood (bus 70)", "Indeed", C, 19, 0, "Rejected", 18,
      "Meets the requirements; no diet-order experience (preferred).", ""],
    [58, "Possible", "Grill Cook", "Ember Room", "$21/hr + tips", "Beaverton (MAX Blue Line)", "Indeed", L, 9, 0, "Found", null,
      "One gap: 2 years on a wood-fired grill preferred. Commute is about 35 minutes on MAX.", ""],
    [44, "Possible", "Pizza Cook", "Stonehearth Pizza", "$20/hr + tips", "Laurelhurst (bus 20)", "Indeed", L, 15, 0, "Found", null,
      "One real gap: wood-fired oven experience required.", ""],
    [33, "Long shot", "Sous Chef", "Meridian Hotel Grill", "$26/hr", "Downtown", "Hotel careers page", S, 20, 0, "Found", null,
      "Several gaps: 2 years as sous chef and full ordering and scheduling responsibility required.", ""],
    [77, "Good", "Prep Cook", "Cascade Commissary", "$21/hr", "Central Eastside (bus 6)", "Indeed", C, 25, 0, "Acknowledged", 23,
      "Meets every requirement. Confirmation email received; no word since.", ""],
    [63, "Good", "Line Cook", "Copperline Diner", "$20–22/hr", "Montavilla (bus 15)", "Craigslist", L, null, 0, "Found", null,
      "Meets the requirements. Posted date unknown (listing says 30+ days); check it's still open.", ""],
  ];

  function buildRows() {
    const head = ["Date found", "Score", "Job title", "Employer", "Pay", "Location", "Source", "Link", "Posted", "Template", "Status", "Date applied", "Last update", "Next action", "Notes"];
    const NEXT = { Applied: "Follow up in 7 to 10 days if no word", Acknowledged: "Wait; follow up after 7 days", Interview: "Prepare for the interview (time is in your email)",
      Assessment: "Complete the online skills questionnaire", Rejected: "None (closed)", "Ready to apply": "Review docs, then apply" };
    const rows = [head];
    JOBS.forEach(([n, band, title, emp, pay, loc, src, tmpl, posted, hrs, status, applied, notes]) => {
      const found = posted === null ? runAt(0, 31) : runAt(hrs, posted);
      const slug = (title + "-" + emp).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      rows.push([
        stamp(found), n == null ? "" : `${n} (${band})`, title, emp, pay, loc, src, `https://example.com/jobs/${slug}`,
        posted === null ? "30+ days" : dayISO(daysAgo(posted)), tmpl, status,
        applied == null ? "" : dayISO(daysAgo(applied)), dayISO(applied == null ? found : daysAgo(Math.max(0, applied - 1))),
        NEXT[status] || "", (n == null ? "" : `${n} (${band}): `) + notes,
      ]);
    });
    return rows;
  }

  // ---------- the "tailoring agent" (simulated) ----------
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const longDate = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  function tailor(job) {
    const spec = JOBS.find(j => j[2] === job.title && j[3] === job.employer) || [];
    const t = clone(window.DEMO_TEMPLATES[job.template] || window.DEMO_TEMPLATES["Line / station cook"]);
    const area = String(job.location || "").replace(/\s*\(.*\)$/, "");
    const why = spec[13] || `${job.employer} has a strong reputation in Portland's food scene and a kitchen that takes care with its prep. I'd be glad to bring steady, clean station work to that team.`;
    const fill = (s) => String(s)
      .replace(/\[\[Employer\]\]/g, job.employer).replace(/\[\[Role\]\]/g, job.title)
      .replace(/\[\[Month D, YYYY\]\]/g, longDate(new Date()))
      .replace(/\[\[Neighborhood, Portland, OR\]\]/g, `${area}, Portland, OR`)
      .replace(/\[\[Why this employer[^\]]*\]\]/g, why);
    const walk = (x) => Array.isArray(x) ? x.map(walk) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, walk(v)])) : typeof x === "string" ? fill(x) : x;
    const out = walk(t);
    out.employer = job.employer; out.role = job.title;
    return out;
  }
  function revise(data, request) {
    const d = clone(data), q = request.toLowerCase(), changed = [];
    const conn = (d.cover.sections || []).find(s => (s.bullets || []).length);
    if (/short|trim|cut/.test(q) && conn && conn.bullets.length > 2) { conn.bullets.pop(); changed.push("Cut the last bullet from the cover letter"); }
    if (/warm|friendl|less formal/.test(q)) { d.cover.signoff = "Thanks so much,"; d.cover.greeting = d.cover.greeting.replace(/^Dear /, "Hi "); changed.push("Made the greeting and sign-off warmer"); }
    if (/prep|inventory/.test(q)) { d.experience[0].bullets.unshift(d.experience[0].bullets.pop()); changed.push("Moved the prep list and inventory bullet to the top"); }
    if (!changed.length) changed.push("Demo only: in the live version an AI agent rewrites both documents to match the request; here the text stays the same");
    return { data: d, changed: changed.join("; ") + "." };
  }

  // ---------- in-memory sheet ----------
  const sheet = { jobs: buildRows(), apps: [["Job", "Updated", "Data"]] };
  const appRow = (emp, title) => sheet.apps.findIndex((r, i) => i && r[0] === `${emp} | ${title}`);
  function saveApp(emp, title, data) {
    const row = [`${emp} | ${title}`, stamp(new Date()), JSON.stringify(data)], i = appRow(emp, title);
    if (i > 0) sheet.apps[i] = row; else sheet.apps.push(row);
  }
  // Jobs that already have documents when the demo opens.
  sheet.jobs.slice(1).forEach(r => {
    if (["Ready to apply", "Applied", "Interview", "Acknowledged", "Assessment"].includes(r[10]) && JOBS.find(j => j[2] === r[2] && j[3] === r[3])[13])
      saveApp(r[3], r[2], tailor({ employer: r[3], title: r[2], template: r[9], location: r[5] }));
  });

  const watchers = [];
  const values = (range) => ({ payload: { values: clone(range.startsWith("Applications") ? sheet.apps : sheet.jobs) } });
  const notify = () => watchers.forEach(w => { try { w.h({ type: "data", result: values(w.range) }); } catch (e) {} });
  const later = (ms, fn) => setTimeout(() => { fn(); notify(); }, ms);
  const fmtTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  function updateValues({ range, values: v }) {
    const m = range.match(/^Jobs!([A-Z])(\d+):([A-Z])\d+$/); if (!m) throw { code: "tool_error", message: "range not supported in the demo" };
    const row = sheet.jobs[+m[2] - 1], col = m[1].charCodeAt(0) - 65;
    if (!row) throw { code: "tool_error", message: "row not found" };
    v[0].forEach((x, k) => { if (x != null) row[col + k] = String(x).replace(/^'/, ""); });
  }
  function findJob(p) { return sheet.jobs.find((r, i) => i && r[3] === p.employer && r[2] === p.title); }

  function fireTrigger({ trigger_id, text }) {
    const p = JSON.parse(text);
    if (trigger_id === "demo-tailor") {
      later(7000, () => {
        const r = findJob(p); if (!r) return;
        saveApp(p.employer, p.title, tailor({ employer: p.employer, title: p.title, template: r[9], location: r[5] }));
        r[10] = "Ready to apply"; r[12] = dayISO(new Date()); r[13] = "Review docs, then apply";
        r[14] = `${r[14]} Tailored ${dayISO(new Date())} from the ${r[9]} template.`;
      });
    } else if (trigger_id === "demo-revise") {
      later(6000, () => {
        const r = findJob(p), i = appRow(p.employer, p.title); if (!r || i < 1) return;
        const out = revise(JSON.parse(sheet.apps[i][2]), p.request);
        saveApp(p.employer, p.title, out.data);
        const ask = p.request.replace(/"/g, "").replace(/\s+/g, " ").slice(0, 140);
        r[12] = dayISO(new Date()); r[13] = "Review docs, then apply";
        r[14] = `${r[14]} [Revision ${stamp(new Date())}] You asked: "${ask}". Changed: ${out.changed}`;
      });
    }
    return { payload: { ok: true, started: fmtTime(new Date()) } };
  }

  // ---------- "Gmail" (prepared emails for applied jobs) ----------
  const MAIL = {
    "Lantern Hall Catering": [[1, "Thank you for applying to Lantern Hall Catering", "Lantern Hall Careers"]],
    "Ferro Kitchen": [[3, "We've received your application: Line Cook", "Ferro Kitchen via Culinary Agents"]],
    "Green Fern Café": [[4, "Thanks for your application", "Green Fern Café"], [1, "Interview: can you come in Thursday for a stage?", "Maya, Green Fern Café"]],
    "Portside Grocery": [[4, "Application received: Deli Cook", "Portside Grocery Careers"], [2, "Next step: online skills questionnaire (due in 5 days)", "Portside Grocery Careers"]],
    "Willamette Senior Living": [[17, "Thank you for your interest", "Willamette Senior Living HR"], [9, "Update on your application", "Willamette Senior Living HR"]],
    "Cascade Commissary": [[22, "Application confirmation: Prep Cook", "Cascade Commissary"]],
  };
  // Gmail message ids encode their send time (milliseconds << 20, in hex); the page reads dates that way.
  const mailId = (d) => (BigInt(d.getTime()) << 20n).toString(16);
  function searchThreads({ query }) {
    const emp = (String(query).match(/"([^"]+)"/) || [])[1] || "";
    const list = MAIL[emp] || [];
    return { payload: { threads: list.map(([ago, subject, sender]) => {
      const d = new Date(daysAgo(ago).getTime() + 10.5 * 3600000), id = mailId(d);
      return { id, messageCount: 1, messages: [{ id, subject, sender }] };
    }) } };
  }

  // ---------- the window.claude stand-in ----------
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const mcp = {
    watchTool(server, tool, input, h) {
      const w = { range: input.range, h }; watchers.push(w);
      setTimeout(() => h({ type: "data", result: values(input.range) }), 150);
      return () => { const i = watchers.indexOf(w); if (i >= 0) watchers.splice(i, 1); };
    },
    async invalidate() {},
    async callTool(server, tool, input) {
      await delay(250);
      if (tool === "get_values") return values(input.range);
      if (tool === "update_values") { updateValues(input); setTimeout(notify, 0); return { payload: {} }; }
      if (tool === "fire_trigger") return fireTrigger(input);
      if (tool === "search_threads") { await delay(500); return searchThreads(input); }
      throw { code: "tool_error", message: `${tool} isn't part of the demo`, server };
    },
  };
  const downloads = {
    async save({ filename, data }) {
      const url = URL.createObjectURL(data), a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { status: "saved" };
    },
  };
  window.claude = { use: async (name) => name === "mcp" ? mcp : name === "downloads" ? downloads : null };
})();
