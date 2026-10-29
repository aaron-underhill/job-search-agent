"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {normalizeJob, deduplicateJobs} = require("../lib/jobs/normalize");
const posting = {title:" Junior Developer ", employer:" Example Co ",description:"Python and SQL",url:"https://example.com/jobs/123?utm_source=alerts&ref=careers#apply"};
test("normalizes a job without inventing source verification",()=>{
 const j=normalizeJob(posting,{source:"career page",discoveredAt:"2026-10-29T00:00:00Z"});
 assert.equal(j.title,"Junior Developer");
 assert.equal(j.url,"https://example.com/jobs/123?ref=careers");
 assert.equal(j.verification,"unverified");
 assert.equal(j.verifiedAt,null);
});
test("rejects script URLs, local hosts, and missing descriptions",()=>{
 for (const url of ["javascript:alert(1)","http://localhost/jobs","file:///tmp/job"]) {
  assert.throws(()=>normalizeJob({...posting,url}), /URL/);
 }
 assert.throws(()=>normalizeJob({...posting,description:""}),/Missing/);
});
test("deduplicates exact normalized URLs",()=>{
 const a=normalizeJob(posting);
 const b=normalizeJob({...posting,url:"https://example.com/jobs/123?ref=careers&utm_campaign=test"});
 assert.equal(deduplicateJobs([a,b]).length,1);
});
