// Analiz arşivi — CİHAZ DEPOSU (sunucu diski), tarayıcı belleği değil.
// Her analiz ayrı JSON dosyası; hiçbiri değiştirilmez/silinmez otomatik olarak.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "data", "analizler");

function ensureDir() {
  fs.mkdirSync(DIR, { recursive: true });
}

export function kayitDosyaAdi(id) {
  const safe = String(id).replace(/[^A-Za-z0-9_-]+/g, "_").slice(-120);
  return `${safe}.json`;
}

export function saveAnaliz(record) {
  ensureDir();
  const id = record.id || `a-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const rec = { ...record, id };
  fs.writeFileSync(path.join(DIR, kayitDosyaAdi(id)), JSON.stringify(rec, null, 1));
  return rec;
}

export function listAnalizler(limit = 300) {
  ensureDir();
  const out = [];
  for (const f of fs.readdirSync(DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
    } catch {
      /* bozuk dosya: yok say */
    }
  }
  out.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  return out.slice(0, limit);
}

export function deleteAnaliz(id) {
  ensureDir();
  const stem = kayitDosyaAdi(id);
  const f = path.join(DIR, stem);
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    return true;
  }
  return false;
}

export function analizSayisi() {
  ensureDir();
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).length;
}