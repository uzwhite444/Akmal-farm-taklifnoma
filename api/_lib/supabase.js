// Ichki yordamchi: Supabase REST'ga service_role kalit bilan murojaat.
// Vercel bu papkani (nomi "_" bilan boshlanadi) marshrut sifatida ochmaydi.

function baseUrl() {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL sozlanmagan");
  return url.replace(/\/$/, "") + "/rest/v1";
}

function headers(extra) {
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY sozlanmagan");
  return Object.assign({ apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, extra || {});
}

// GET bitta resurs (masalan site_content, id=1)
async function sbSelect(table, query) {
  const r = await fetch(`${baseUrl()}/${table}?${query}`, { headers: headers() });
  if (!r.ok) throw new Error(table + " select failed: " + (await r.text()));
  return r.json();
}

async function sbInsert(table, row) {
  const r = await fetch(`${baseUrl()}/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(table + " insert failed: " + (await r.text()));
  return r.json();
}

async function sbUpsert(table, row, onConflict) {
  const r = await fetch(`${baseUrl()}/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(table + " upsert failed: " + (await r.text()));
  return r.json();
}

module.exports = { sbSelect, sbInsert, sbUpsert };
