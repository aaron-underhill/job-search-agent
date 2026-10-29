// Public liveness endpoint; not evidence of a configured agent.
module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ok:true, service:"job-search-agent", mode:"demo", integrationsConfigured:false});
};
