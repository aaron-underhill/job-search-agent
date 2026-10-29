"use strict";

/**
 * Provider-independent, server-side text generation.
 * Never import this file in browser code; credentials are read only at call time.
 * Both providers return a common { text, provider, model } shape.
 */
const DEFAULT_MODELS = Object.freeze({
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-5",
});

function normalizeProvider(value) {
  const provider = String(value || "openai").trim().toLowerCase();
  if (!Object.hasOwn(DEFAULT_MODELS, provider)) {
    throw new Error("Unsupported model provider: " + provider);
  }
  return provider;
}
function safeInput(prompt) {
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 100000) {
    throw new TypeError("Prompt must be a nonempty string up to 100000 characters");
  }
  return prompt;
}
async function requestJSON(url, options, fetchImpl) {
  const response = await fetchImpl(url, options);
  if (!response.ok) {
    // Do not print provider response bodies: they can contain user inputs or tokens.
    throw new Error("AI provider request failed (HTTP " + response.status + ")");
  }
  return response.json();
}
async function generateText({ prompt, system = "", provider, model, maxOutputTokens = 1200, fetchImpl = fetch } = {}) {
  safeInput(prompt);
  const name = normalizeProvider(provider || process.env.AI_PROVIDER);
  if (typeof system !== "string") throw new TypeError("System instructions must be text");
  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 8192) {
    throw new RangeError("maxOutputTokens must be between 1 and 8192");
  }
  const selectedModel = model || process.env.AI_MODEL || DEFAULT_MODELS[name];
  if (name === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    const response = await requestJSON("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {"Authorization": "Bearer " + key, "Content-Type": "application/json"},
      body: JSON.stringify({
        model: selectedModel,
        instructions: system || undefined,
        input: prompt,
        max_output_tokens: maxOutputTokens,
        store: false
      })
    }, fetchImpl);
    const text = (response.output || []).flatMap(item => item.content || [])
      .filter(part => part.type === "output_text").map(part => part.text || "").join("\n");
    if (!text) throw new Error("AI provider returned no text");
    return {text, provider: name, model: selectedModel};
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const response = await requestJSON("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {"x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: maxOutputTokens,
      system: system || undefined,
      messages: [{role: "user", content: prompt}]
    })
  }, fetchImpl);
  const text = (response.content || []).filter(part => part.type === "text")
    .map(part => part.text || "").join("\n");
  if (!text) throw new Error("AI provider returned no text");
  return {text, provider: name, model: selectedModel};
}
module.exports = {generateText, normalizeProvider, DEFAULT_MODELS};
