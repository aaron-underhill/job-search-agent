"use strict";

/** Normalize externally sourced postings before any model evaluation or storage. */
function normalizeJob(raw, {source, discoveredAt = new Date().toISOString()} = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("Invalid job");
  const title = String(raw.title || "").trim();
  const employer = String(raw.employer || raw.company || "").trim();
  const location = String(raw.location || "").trim();
  const description = String(raw.description || "").trim();
  if (!title || !employer || !description) throw new TypeError("Missing job title, employer or description");
  if (description.length > 100000) throw new RangeError("Job description too long");
  let url;
  try { url = new URL(String(raw.url || raw.link || "")); }
  catch { throw new TypeError("Invalid job URL"); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new TypeError("Unsafe job URL scheme");
  if (!url.hostname || ["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase())) {
    throw new TypeError("Nonpublic job URL");
  }
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
  }
  const canonicalUrl = url.toString();
  return {
    id: canonicalUrl,
    title, employer, location, description,
    url: canonicalUrl,
    source: String(source || raw.source || "unknown").trim(),
    discoveredAt,
    postedAt: raw.postedAt || null,
    verifiedAt: null,
    verification: "unverified",
    status: "found"
  };
}

/** Exact URL deduplication, newest record replaces old. Other duplicate patterns require human review. */
function deduplicateJobs(jobs) {
  const byId = new Map();
  for (const job of jobs) byId.set(job.id, job);
  return [...byId.values()];
}

module.exports = {normalizeJob, deduplicateJobs};
