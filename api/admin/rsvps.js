// Akmal Farm — Taklifnoma :: RSVP hisoboti (AUTH SHART)
// GET                -> JSON: barcha javoblar + lokatsiyalar bo'yicha jamlanma
// GET ?format=csv    -> Excel/CSV yuklab beradi (UTF-8 BOM, ; ajratgich)

const { requireSession } = require("../_lib/auth");
const { sbSelect } = require("../_lib/supabase");

async function fetchRows() {
  // Eng yangi birinchi; katta ziyofat uchun ham yetarli chegara.
  try {
    return await sbSelect(
      "rsvps",
      "select=name,phone,attending,guests,message,location,created_at&order=created_at.desc&limit=10000"
    );
  } catch (e) {
    // location ustuni yo'q bo'lsa (0003 migratsiya hali ishlamagan) — usiz olamiz,
    // shunda hisobot baribir ishlaydi (lokatsiya "—" bo'lib ko'rinadi).
    if (/location/i.test(e.message || "")) {
      return sbSelect(
        "rsvps",
        "select=name,phone,attending,guests,message,created_at&order=created_at.desc&limit=10000"
      );
    }
    throw e;
  }
}

function summarize(rows) {
  const byLocation = {};
  const totals = { responses: 0, coming_responses: 0, notcoming_responses: 0, coming_people: 0 };
  for (const r of rows) {
    const loc = (r.location && String(r.location).trim()) || "—";
    if (!byLocation[loc]) byLocation[loc] = { location: loc, coming_responses: 0, notcoming_responses: 0, coming_people: 0, total_responses: 0 };
    const g = byLocation[loc];
    g.total_responses++;
    totals.responses++;
    if (r.attending) {
      g.coming_responses++;
      totals.coming_responses++;
      const guests = Number(r.guests) || 0;
      g.coming_people += guests;
      totals.coming_people += guests;
    } else {
      g.notcoming_responses++;
      totals.notcoming_responses++;
    }
  }
  const locations = Object.values(byLocation).sort((a, b) => b.total_responses - a.total_responses);
  return { totals, locations };
}

function csvCell(v) {
  const s = v === null || v === undefined ? "" : String(v);
  // ; ajratgich, shuning uchun ; " va yangi qatorlarni qo'shtirnoq bilan ekranlaymiz
  if (/[";\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(rows) {
  const header = ["Lokatsiya / Локация", "Ism / Имя", "Telefon / Телефон", "Holat / Статус", "Mehmonlar / Гостей", "Izoh / Комментарий", "Sana / Дата"];
  const lines = [header.map(csvCell).join(";")];
  for (const r of rows) {
    let dt = r.created_at;
    try { dt = new Date(r.created_at).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" }); } catch (e) { /* raw */ }
    lines.push([
      csvCell(r.location || "—"),
      csvCell(r.name),
      csvCell(r.phone),
      csvCell(r.attending ? "Придёт / Keladi" : "Не придёт / Kelmaydi"),
      csvCell(r.attending ? (Number(r.guests) || 0) : 0),
      csvCell(r.message || ""),
      csvCell(dt),
    ].join(";"));
  }
  // \r\n va UTF-8 BOM — Excel kirillni to'g'ri ochishi uchun
  return "﻿" + lines.join("\r\n") + "\r\n";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const session = requireSession(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  let rows;
  try {
    rows = await fetchRows();
    if (!Array.isArray(rows)) rows = [];
  } catch (e) {
    console.error("rsvps report fetch failed:", e.message);
    return res.status(500).json({ error: "db_error" });
  }

  const format = req.query && req.query.format;
  if (format === "csv") {
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="akmal-rsvp-${stamp}.csv"`);
    return res.status(200).send(csv);
  }

  return res.status(200).json({ ok: true, rows, summary: summarize(rows) });
};
