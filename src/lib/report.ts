// Premium PDF raporu: tarayıcının "PDF olarak kaydet" baskısını kullanır.
// Ek paket gerektirmez, Türkçe karakterler bozulmaz.

import type { SavedAnalysis } from "./analyses";
import type { Meeting, Race } from "./types";

const STYLE = `
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 12mm 11mm 15mm; }
  body { font-family: "Segoe UI", Inter, system-ui, -apple-system, sans-serif; color: #1c2620; font-size: 10.5pt; line-height: 1.55; margin: 0; }
  .cover { background: #0d1f15; color: #f2ecdc; border-radius: 10px; padding: 26px 28px 22px; position: relative; overflow: hidden; }
  .cover::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: linear-gradient(90deg, #c9a24b, #f0d48a 45%, #c9a24b); }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-mark { width: 34px; height: 34px; border: 1.5px solid #c9a24b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #e9c979; }
  .brand-name { font-family: Georgia, "Times New Roman", serif; font-size: 22pt; letter-spacing: 0.5px; }
  .brand-sub { font-size: 8.5pt; letter-spacing: 3px; text-transform: uppercase; color: #c9a24b; margin-top: 2px; }
  .cover h1 { font-family: Georgia, serif; font-size: 19pt; margin: 16px 0 4px; font-weight: 600; }
  .cover .race-line { font-size: 11pt; color: #d8cfb6; }
  .cover .stamp { margin-top: 12px; font-size: 8.5pt; color: #9db3a1; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 16px 0 4px; }
  .meta-item { background: #f4f1e6; border: 1px solid #e2d9bd; border-radius: 8px; padding: 7px 10px; }
  .meta-k { display: block; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1px; color: #8a7c4f; }
  .meta-v { font-weight: 600; font-size: 10pt; }
  h2 { font-family: Georgia, serif; font-size: 13.5pt; color: #0d1f15; border-bottom: 2px solid #c9a24b; padding-bottom: 4px; margin: 22px 0 10px; page-break-after: avoid; }
  h3 { font-size: 11pt; color: #23402c; margin: 14px 0 6px; page-break-after: avoid; }
  p { margin: 5px 0; }
  a { color: #6b5a22; }
  ul { margin: 6px 0; padding-left: 0; list-style: none; }
  ul li { background: #faf8f0; border: 1px solid #e9e1c8; border-radius: 6px; padding: 5px 10px; margin: 4px 0; page-break-inside: avoid; }
  ul li::before { content: "◆ "; color: #c9a24b; font-size: 8pt; }
  .sub-h { font-weight: 700; color: #0d1f15; font-size: 10.5pt; background: #f4f1e6; border-left: 4px solid #c9a24b; border-radius: 0 6px 6px 0; padding: 6px 10px; margin: 10px 0 4px; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
  th { background: #0d1f15; color: #e9c979; text-align: left; padding: 7px 8px; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; }
  td { border-bottom: 1px solid #e4ddc4; padding: 6px 8px; }
  tr:nth-child(even) td { background: #faf8f0; }
  .c { text-align: center; }
  .tag { font-size: 7.5pt; background: #0d1f15; color: #e9c979; border-radius: 4px; padding: 1px 6px; }
  .md-table td:first-child { font-weight: 600; width: 34%; }
  hr { border: none; border-top: 1px solid #d9cfA9; margin: 14px 0; }
  .warn { background: #fdf6e3; border: 1px solid #c9a24b; border-left: 5px solid #c9a24b; border-radius: 8px; padding: 10px 14px; margin-top: 16px; font-size: 9.5pt; page-break-inside: avoid; }
  .footer { position: static; margin-top: 22px; text-align: center; font-size: 7.5pt; color: #8a938a; padding: 6px 0; }
  strong { color: #0d1f15; }
  .page-break { break-before: page; }
  .folder-index td:first-child { font-weight: 700; width: 18%; }
`;

function docShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"/>
<title>${esc(title)} — Ganian</title>
<style>${STYLE}</style></head><body>${body}
  <div class="footer">Ganian — TJK ile bağlantısı olmayan bağımsız bilgilendirme arayüzü · ganian</div>
</body></html>`;
}

function coverHtml(heading: string, sub: string, stamp: string): string {
  return `<div class="cover">
    <div class="brand"><div class="brand-mark">◈</div>
      <div><div class="brand-name">Ganian</div><div class="brand-sub">Profesyonel Yarış Analiz Raporu</div></div>
    </div>
    <h1>${esc(heading)}</h1>
    <div class="race-line">${esc(sub)}</div>
    <div class="stamp">${esc(stamp)}</div>
  </div>`;
}

const DISCLAIMER =
  "<strong>Sorumluluk reddi:</strong> Bu rapor bilgilendirme amaçlıdır; kazanç garantisi vermez. At yarışları şansa dayalıdır, sorumlu oynayın. Veriler TJK kaynaklarından derlenmiştir; pist değişikliği veya son dakika gelişmeleri senaryoyu değiştirebilir.";

function analysisBodyHtml(meeting: Meeting, race: Race, analysis: string): string {
  return `${raceMeta(meeting, race)}
  ${startersTable(race)}
  <h2>Profesyonel Analiz</h2>
  ${mdToHtml(analysis)}
  <div class="warn">${DISCLAIMER}</div>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

// Model çıktısındaki basit markdown'ı rapor HTML'ine çevirir:
// ## / ### başlık, - madde, 1. numaralı, | tablo, --- çizgi, **kalın**
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let inUl = false;
  let inTable = false;

  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
  };
  const closeTable = () => {
    if (inTable) { html += "</tbody></table>"; inTable = false; }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (/^\|.*\|$/.test(line)) {
      closeLists();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // ayraç satırı
      if (!inTable) { html += '<table class="md-table"><tbody>'; inTable = true; }
      html += `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`;
      continue;
    }
    closeTable();

    if (/^```/.test(line) || /^~~~/.test(line)) continue; // kod çiti (sıralı tahmin bloğu) — görünmez
    if (/^---+$/.test(line)) { closeLists(); html += "<hr/>"; continue; }
    if (/^###\s+/.test(line)) { closeLists(); html += `<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`; continue; }
    if (/^##\s+/.test(line)) { closeLists(); html += `<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`; continue; }

    // "1. Başlık" satırları rozetli numaraya çevrilmez; sade alt başlık olur.
    // Sayı yalnızca at başlıklarının kendi metninde kalır (örn. "1 BATMAN KIZI — ...").
    const sub = line.match(/^\d+[.)]\s+(.*)$/);
    if (sub) {
      closeLists();
      html += `<div class="sub-h">${inline(sub[1])}</div>`;
      continue;
    }
    const ul = line.match(/^[-*•]\s+(.*)$/);
    if (ul) {
      if (!inUl) { html += "<ul>"; inUl = true; }
      html += `<li>${inline(ul[1])}</li>`;
      continue;
    }
    closeLists();
    if (!line) continue;
    html += `<p>${inline(line)}</p>`;
  }
  closeLists();
  closeTable();
  return html;
}

function raceMeta(meeting: Meeting, race: Race): string {
  const w = meeting.weather;
  const bos = (v: unknown) => v == null || v === "" || v === "—" || v === "-" || v === 0 || v === "0";
  const hava = w
    ? [`${bos(w.sky) ? "" : esc(w.sky)}`, `${bos(w.temp) ? "" : `${w.temp}°`}`, `${bos(w.humidity) ? "" : `nem %${w.humidity}`}`]
        .filter(Boolean)
        .join(" · ") || "—"
    : "—";
  const pist = `${esc(race.trackLabel || "—")} · ${esc(String(race.distance || "—"))} m`;
  const items: [string, string][] = [
    ["Hipodrom", `${esc(meeting.name || meeting.city)}`],
    ["Tarih", esc(race.date || "—")],
    ["Koşu", `${esc(String(race.no || "—"))}. koşu · ${esc(race.time || "—")}`],
    ["Pist / Mesafe", pist],
    ["Grup / Tür", `${esc(race.group || "—")} · ${esc(race.raceType || race.named || "—")}`],
    ["Hava", hava],
  ];
  return `<div class="meta">${items.map(([k, v]) => `<div class="meta-item"><span class="meta-k">${k}</span><span class="meta-v">${v}</span></div>`).join("")}</div>`;
}

function startersTable(race: Race): string {
  const rows = race.horses
    .map(
      (h) => `<tr>
        <td class="c">${esc(h.number || "—")}</td>
        <td><strong>${esc(h.name)}</strong>${h.scratched ? ' <span class="tag">Koşmaz</span>' : ""}${h.coupled ? ' <span class="tag">Eküri</span>' : ""}</td>
        <td class="c">${h.kg ?? "—"}</td>
        <td class="c">${esc(h.hp || "—")}</td>
        <td>${esc(h.jockeyName || "—")}</td>
        <td>${esc(h.trainerName || "—")}</td>
        <td class="c">${esc(h.agf ? `%${h.agf}` : "—")}</td>
      </tr>`,
    )
    .join("");
  return `<h2>Start Listesi</h2>
  <table class="starters"><thead><tr>
    <th>No</th><th>At</th><th>Kg</th><th>HP</th><th>Jokey</th><th>Antrenör</th><th>AGF</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

export function buildReportHtml(
  meeting: Meeting,
  race: Race,
  analysis: string,
  modelId: string,
  effort = "",
): string {
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  // Tarayıcı "PDF olarak kaydet"te dosya adını <title>'dan alır.
  // Eğik çizgi dosya adında yasak olduğu için tarihi tireliyoruz.
  const safeDate = String(race.date || "").replaceAll("/", "-").replaceAll(".", "-") || "tarihsiz";
  const safeCity = String(meeting.city || "hipodrom").replace(/[\\/:*?"<>|]/g, "").trim() || "hipodrom";
  const fileName = `Ganian_${safeDate}_${safeCity}_${String(race.no || "?")}.Kosu_${modelId}${effort ? `_${effort}` : ""}`;
  const stamp = `Rapor tarihi: ${now} (TSİ) · Model: ${modelId}${effort ? ` (${effort})` : ""} · TJK verileriyle hazırlanmıştır`;

  return docShell(
    fileName,
    `${coverHtml(
      `${meeting.name || meeting.city} — ${String(race.no || "")}. Koşu`,
      `${race.named || race.raceType || ""} · ${String(race.distance || "")} m ${race.trackLabel || ""} · ${race.date || ""} ${race.time || ""}`,
      stamp,
    )}
  ${analysisBodyHtml(meeting, race, analysis)}`,
  );
}

export function buildFolderReportHtml(folderLabel: string, items: SavedAnalysis[]): string {
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const safeLabel = folderLabel.replace(/[\\/:*?"<>|]/g, "").replaceAll("/", "-").replaceAll(/\s+/g, "_");
  const fileName = `Ganian_${safeLabel}_${items.length}Analiz`;
  const stamp = `Rapor tarihi: ${now} (TSİ) · ${items.length} koşu · TJK verileriyle hazırlanmıştır`;

  const index = `<h2>İçindekiler</h2>
  <table class="folder-index"><tbody>${items
    .map(
      (a) =>
        `<tr><td>${esc(String(a.raceNo))}. Koşu</td><td>${esc(a.city)} · ${esc(a.dateLabel)} · ${esc(a.model)}${a.effort ? ` (${esc(a.effort)})` : ""}</td></tr>`,
    )
    .join("")}</tbody></table>`;

  const bodies = items
    .map(
      (a, i) =>
        `<div class="${i > 0 ? "page-break" : ""}"><h2>${esc(a.city)} — ${esc(String(a.raceNo))}. Koşu <span style="font-size:10pt;font-family:inherit;">· ${esc(a.model)}${a.effort ? ` (${esc(a.effort)})` : ""}</span></h2>${analysisBodyHtml(a.meeting, a.race, a.analysis)}</div>`,
    )
    .join("");

  return docShell(
    fileName,
    `${coverHtml(folderLabel, `${items.length} koşunun toplu analiz raporu`, stamp)}${index}${bodies}`,
  );
}

export function printReport(html: string): void {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument || frame.contentWindow?.document;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  const win = frame.contentWindow;
  if (!win) { cleanup(); return; }
  win.addEventListener?.("afterprint", cleanup);
  // Yazı tipleri ve stiller otursun diye kısa bekle
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(cleanup, 2000);
  }, 350);
}
