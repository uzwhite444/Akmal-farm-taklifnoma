// VAQTINCHA: Vercel qaysi header'larni ishonchli beradi — tekshirish uchun.
// Hech qanday maxfiy ma'lumot yo'q. Tekshiruvdan so'ng o'chiriladi.
module.exports = async function handler(req, res) {
  const keys = ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for", "x-vercel-ip", "x-vercel-id", "cf-connecting-ip", "true-client-ip"];
  const out = {};
  keys.forEach((k) => { out[k] = req.headers[k] || null; });
  return res.status(200).json(out);
};
