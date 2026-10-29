"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {generateText, normalizeProvider} = require("../lib/ai/providers");
const {evaluateJob} = require("../lib/ai/score");

test("rejects unknown provider", () => {
  assert.throws(() => normalizeProvider("other"), /Unsupported/);
});
test("OpenAI adapter sends server-side credential and normalizes output", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  const r = await generateText({provider:"openai", prompt:"hello", fetchImpl:async (url, init) => {
    assert.match(url, /openai.com/);
    assert.equal(init.headers.Authorization, "Bearer test-key");
    assert.equal(JSON.parse(init.body).store, false);
    return {ok:true,json:async()=>({output:[{content:[{type:"output_text",text:"Hello"}]}]})};
  }});
  assert.equal(r.text,"Hello");
  delete process.env.OPENAI_API_KEY;
});
test("Anthropic adapter normalizes output", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  const r = await generateText({provider:"anthropic",prompt:"hello",fetchImpl:async (url, init)=>{
    assert.match(url,/anthropic.com/);
    assert.equal(init.headers["x-api-key"],"test-key");
    return {ok:true,json:async()=>({content:[{type:"text",text:"Hello"}]})};
  }});
  assert.equal(r.text,"Hello");
  delete process.env.ANTHROPIC_API_KEY;
});
test("job evaluation validates scoring schema", async () => {
  const result = await evaluateJob({
    applicantProfile:"JavaScript and Python experience",
    job:{title:"Junior Developer",url:"https://example.com/job",description:"JavaScript"},
    generate:async()=>({text:JSON.stringify({score:72,confidence:"medium",gaps:[],rationale:"Matches core skill"}),provider:"mock",model:"mock"})
  });
  assert.equal(result.score,72);
  assert.equal(result.confidence,"medium");
});
test("job evaluation rejects invalid scores", async () => {
  await assert.rejects(()=>evaluateJob({
    applicantProfile:"Python",job:{title:"Developer",url:"https://example.com",description:"Python"},
    generate:async()=>({text:'{"score":180,"confidence":"high","gaps":[],"rationale":"test"}'})
  }),/invalid evaluation schema/);
});
