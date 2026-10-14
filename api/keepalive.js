// Akmal Farm — Taklifnoma :: Supabase keep-alive
// Supabase bepul tarifda 7 kun faollik bo'lmasa loyihani pauzaga qo'yadi.
// Vercel Cron bu endpointni har kuni chaqiradi (vercel.json → crons) va
// bazaga bir nechta yengil so'rov yuboradi — shunda loyiha "faol" hisoblanadi.
// Hech qanday ma'lumot qaytarmaydi, faqat holat.

const { sbSelect } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Vercel CRON_SECRET o'rnatilgan bo'lsa, Cron uni "Authorization: Bearer ..." bilan yuboradi.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== "Bearer " + secret) {
    return res.status(401).json({ ok: false });
  }

  try {
    await sbSelect("site_content", "select=id&limit=1");
    await sbSelect("rsvps", "select=id&limit=1");
    await sbSelect("site_content", "select=updated_at&id=eq.1&limit=1");
    return res.status(200).json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    console.error("keepalive failed:", e.message);
    return res.status(500).json({ ok: false });
  }
};
