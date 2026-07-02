// Ichki yordamchi: login urinishlari uchun IP bo'yicha rate-limit (bruteforce himoyasi).

const crypto = require("crypto");
const { sbSelect, sbInsert } = require("./supabase");

const WINDOW_MIN = 15;
const MAX_FAILS = 8;

function ipHash(req) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  return crypto.createHash("sha256").update(ip + "|" + (process.env.IP_SALT || "akmal")).digest("hex");
}

async function isLocked(req) {
  const hash = ipHash(req);
  const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
  const rows = await sbSelect(
    "admin_login_attempts",
    `select=id&ip_hash=eq.${hash}&success=eq.false&created_at=gte.${encodeURIComponent(since)}&limit=${MAX_FAILS + 1}`
  );
  return { locked: Array.isArray(rows) && rows.length >= MAX_FAILS, hash };
}

async function recordAttempt(hash, username, success) {
  try {
    await sbInsert("admin_login_attempts", { ip_hash: hash, username: username || null, success: !!success });
  } catch (e) {
    console.error("rate-limit log failed:", e);
  }
}

module.exports = { isLocked, recordAttempt, ipHash };
