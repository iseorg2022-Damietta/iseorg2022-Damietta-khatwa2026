// fix-bidi.js — إزالة محارف الاتجاه الخفية من كل ملفات المشروع
const fs = require("fs"), path = require("path");
const BAD = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g; // LRM RLM وعائلتها + BOM
const fixed = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f), st = fs.statSync(p);
    if (st.isDirectory()) { if (!["node_modules", ".next", ".git"].includes(f)) walk(p); }
    else if (/\.(ts|tsx|js|mjs|json|css|prisma)$/.test(f)) {
      const c = fs.readFileSync(p, "utf8");
      const clean = c.replace(BAD, "");
      if (clean !== c) { fs.writeFileSync(p, clean); fixed.push(p); }
    }
  }
})(".");
console.log(fixed.length ? "🧹 نُظّفت " + fixed.length + " ملفاً:\n" + fixed.join("\n")
                         : "✅ لا محارف خفية");