const { requireSession, COOKIE_NAME } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // VAQTINCHA DIAGNOSTIKA — hech qanday maxfiy qiymat qaytarilmaydi,
  // faqat struktura (uzunlik/mavjudlik). Tekshiruvdan so'ng olib tashlanadi.
  if (req.query && req.query.debug === "1") {
    const rawCookieHeader = req.headers.cookie || "";
    const m = rawCookieHeader.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]+)"));
    const tokenPresent = !!m;
    const token = m ? m[1] : "";
    const partsCount = token ? token.split(".").length : 0;
    return res.status(200).json({
      debug: true,
      hasCookieHeader: !!req.headers.cookie,
      cookieHeaderLen: rawCookieHeader.length,
      cookieHeaderPreviewKeys: rawCookieHeader.split(";").map(function (s) { return s.trim().split("=")[0]; }),
      tokenPresent: tokenPresent,
      tokenLen: token.length,
      tokenPartsCount: partsCount,
      hasSecretEnv: !!process.env.ADMIN_SESSION_SECRET,
      secretEnvLen: (process.env.ADMIN_SESSION_SECRET || "").length,
    });
  }

  const session = requireSession(req);
  if (!session) return res.status(401).json({ ok: false });
  return res.status(200).json({ ok: true, username: session.u, exp: session.exp });
};
