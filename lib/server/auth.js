"use strict";
const {createHash,timingSafeEqual} = require("node:crypto");
function authorized(req, secret = process.env.PRIVATE_API_TOKEN) {
  if (!secret || secret.length < 32) return false;
  const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || "");
  if (!match) return false;
  const expected = createHash("sha256").update(secret).digest();
  const provided = createHash("sha256").update(match[1]).digest();
  return timingSafeEqual(expected, provided);
}
module.exports = {authorized};
