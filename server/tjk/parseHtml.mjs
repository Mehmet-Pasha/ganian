import { decodeHtml, stripTags, trackKindFromShort, trDateToIso } from "./format.mjs";

// --- idman (galop) sayfası parser ---
// TJK IdmanIstatistikleri sayfası tek tablo döner:
// At Adı|Irk|Cins|Yaş|1400|1200|1000|800|600|400|200|Durum|İ.Tarihi|İ.Hip.|P.Dur|Pist|İ.T'r|İ.Jokeyi|Detay
// Sütun sırası TJK güncellerse burası ayarlanmalı (savunmacı: eksik alan boş kalır).
export function parseIdmanPage(html) {
  const rows = [];
  const tables = tablesOf(html);
  const table =
    tables.find((t) => /İ\. Tarihi|İmanIstatistik|idman/i.test(t) && rowsOf(t).length > 2) || tables[0] || "";
  for (const row of rowsOf(table)) {
    const cells = cellsOf(row);
    if (cells.length < 17) continue;
    const name = (cells[0]?.text || "").trim();
    if (!name || /at adı/i.test(name)) continue;
    const tarih = (cells[12]?.text || "").trim();
    if (!/^\d{2}[./]\d{2}[./]\d{4}$/.test(tarih)) continue;
    rows.push({
      horseName: name,
      date: tarih,
      dateIso: trDateToIso(tarih),
      hipodrom: (cells[13]?.text || "").trim(),
      pistDurum: (cells[14]?.text || "").trim(),
      track: trackKindFromShort((cells[15]?.text || "").trim()),
      tip: (cells[16]?.text || "").trim(),
      jokey: (cells[17]?.text || "").trim(),
      durum: (cells[11]?.text || "").trim(),
      splits: {
        m1400: (cells[4]?.text || "").trim(),
        m1200: (cells[5]?.text || "").trim(),
        m1000: (cells[6]?.text || "").trim(),
        m800: (cells[7]?.text || "").trim(),
        m600: (cells[8]?.text || "").trim(),
        m400: (cells[9]?.text || "").trim(),
        m200: (cells[10]?.text || "").trim(),
      },
    });
  }
  return rows;
}

function tablesOf(html) {
  return html.match(/<table[\s\S]*?<\/table>/gi) || [];
}

function rowsOf(table) {
  return table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
}

function cellsOf(row) {
  const raw = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
  return raw.map((cell) => {
    const hrefs = [...cell.matchAll(/href="([^"]+)"/gi)].map((m) => decodeHtml(m[1] || ""));
    const imgSrc = cell.match(/<img[^>]+src="([^"]+)"/i)?.[1] || "";
    return { text: stripTags(cell), hrefs, imgSrc };
  });
}

function queryParam(href, key) {
  const m = (href || "").match(new RegExp(`${key}=([^&"']+)`, "i"));
  if (!m || !m[1]) return "";
  try {
    return decodeURIComponent(m[1].replaceAll("+", " "));
  } catch {
    return m[1];
  }
}

function spanValues(html) {
  const out = {};
  const re = /<span class="key">([\s\S]*?)<\/span>\s*<span class="value">([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = re.exec(html))) {
    const key = stripTags(m[1] || "");
    const value = stripTags(m[2] || "");
    if (key) out[key] = value;
  }
  return out;
}

// spanValues ile aynı alanları yakalar ama etiketleri silmeden ham HTML'i de
// tutar; böylece "Baba", "Antrenör", "Sahip" gibi alanlar aslında bir linkse
// (kendi profiline işaret ediyorsa) o linkten kimlik (id) çıkarabiliriz.
function spanValuesWithHtml(html) {
  const out = {};
  const re = /<span class="key">([\s\S]*?)<\/span>\s*<span class="value">([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = re.exec(html))) {
    const key = stripTags(m[1] || "");
    if (key) out[key] = m[2] || "";
  }
  return out;
}

function hrefIn(rawHtml, paramKey) {
  const hrefs = [...(rawHtml || "").matchAll(/href="([^"]+)"/gi)].map((mm) => decodeHtml(mm[1] || ""));
  const match = hrefs.find((h) => new RegExp(`${paramKey}=`, "i").test(h));
  return match ? queryParam(match, paramKey) : "";
}

// TJK sayfalarında bazı alanlar span[key/value] değil, tanım listesi (dl/dt/dd)
// veya basit "Etiket: Değer" satırları olarak da gelebilir; ikinci bir yakalama
// katmanı ekliyoruz ki veri kaynağı biraz değişirse hepsi boş dönmesin.
function labelValuePairs(html) {
  const out = {};
  const dlRe = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let m;
  while ((m = dlRe.exec(html))) {
    const key = stripTags(m[1] || "");
    const value = stripTags(m[2] || "");
    if (key && !(key in out)) out[key] = value;
  }
  return out;
}

// TJK sayfalarındaki etiketler dönem dönem değişiyor ("Lisans" / "Sınıf",
// "Doğ. Trh" / "Doğum Tarihi" gibi). Tam eşleşme yerine normalize edip
// takma-ad listesiyle arıyoruz; ayrıca 2 sütunlu tablo satırlarını da
// üçüncü bir kaynak olarak tarıyoruz (bio bazen tablo içinde geliyor).
function normKey(s) {
  return (s || "").toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü0-9]/g, "");
}

function tablePairs(html) {
  const out = {};
  for (const table of tablesOf(html)) {
    for (const row of rowsOf(table)) {
      const cells = cellsOf(row).map((c) => c.text);
      if (cells.length === 2 && cells[0] && cells[1]) {
        const k = normKey(cells[0]);
        if (k && !(k in out)) out[k] = cells[1];
      }
    }
  }
  return out;
}

function normalizedValues(html) {
  const merged = { ...tablePairs(html), ...labelValuePairs(html), ...spanValues(html) };
  const norm = {};
  for (const [k, v] of Object.entries(merged)) {
    const nk = normKey(k);
    if (nk && !(nk in norm)) norm[nk] = v;
  }
  return norm;
}

function pick(norm, ...aliases) {
  for (const a of aliases) {
    if (norm[a]) return norm[a];
  }
  return "";
}

export function parseHorsePage(id, html) {
  const values = { ...labelValuePairs(html), ...spanValues(html) };
  const rawValues = spanValuesWithHtml(html);
  const name =
    values["İsim"] ||
    stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "") ||
    `At ${id}`;

  const career = [];
  const allTables = tablesOf(html);
  const statsTable = allTables[0] || "";
  for (const row of rowsOf(statsTable).slice(1)) {
    const cells = cellsOf(row).map((c) => c.text);
    if (cells.length < 7) continue;
    const label = cells[0] || "";
    if (!label || /sonuçtan|yükleniyor/i.test(label)) continue;
    career.push({
      label,
      starts: cells[1] || "",
      first: cells[2] || "",
      second: cells[3] || "",
      third: cells[4] || "",
      fourth: cells[5] || "",
      fifth: cells[6] || "",
      earnings: (cells[7] || "").replace(/\s*t$/i, " ₺"),
    });
  }

  const races = [];
  const raceTable = allTables.find((t) => /YarisVideoAt/i.test(t) || rowsOf(t).length > 8) || allTables[1] || "";
  for (const row of rowsOf(raceTable)) {
    const cells = cellsOf(row);
    if (cells.length < 16) continue;
    const date = cells[0]?.text || "";
    if (!/^\d{2}[./]\d{2}[./]\d{4}$/.test(date)) continue;
    const videoHref = cells[19]?.hrefs.find((h) => /YarisVideoAt/i.test(h)) || "";
    const kosu = queryParam(videoHref, "KosuKodu");
    const jokeyHref = cells[8]?.hrefs.find((h) => /JokeyId=/i.test(h)) || "";
    const trainerHref = cells[14]?.hrefs.find((h) => /AntrenorId=/i.test(h)) || "";
    const ownerHref = cells[15]?.hrefs.find((h) => /SahipId=/i.test(h)) || "";
    const raceNoRaw = cells[12]?.text || "";
    const raceNo = (raceNoRaw.match(/^(\d+)/)?.[1] || "").trim();
    const raceName = raceNoRaw.replace(/^\d+\s*-?\s*/, "").trim();
    const trackLabel = cells[3]?.text || "";
    const videoPage = videoHref.startsWith("http")
      ? videoHref
      : videoHref
        ? `https://www.tjk.org${videoHref}`
        : kosu
          ? `https://www.tjk.org/TR/YarisSever/Info/YarisVideoAt/At?AtKodu=${id}&KosuKodu=${kosu}`
          : "";
    races.push({
      date,
      dateIso: trDateToIso(date),
      city: cells[1]?.text || "",
      distance: cells[2]?.text || "",
      trackLabel,
      track: trackKindFromShort(trackLabel),
      position: cells[4]?.text || "",
      time: cells[5]?.text || "",
      kg: cells[6]?.text || "",
      equipment: cells[7]?.text || "",
      jockeyName: cells[8]?.text || "",
      jockeyId: queryParam(jokeyHref, "JokeyId"),
      stall: cells[9]?.text || "",
      odds: cells[10]?.text || "",
      group: cells[11]?.text || "",
      raceNo,
      raceName,
      raceType: cells[13]?.text || "",
      trainerName: cells[14]?.text || "",
      trainerId: queryParam(trainerHref, "AntrenorId"),
      ownerName: cells[15]?.text || "",
      ownerId: queryParam(ownerHref, "SahipId"),
      hp: cells[16]?.text || "",
      prize: cells[17]?.text || "",
      field: cells[18]?.text || "",
      videoPage,
      videoKosuKod: kosu,
      photoUrl: cells[20]?.hrefs.find((h) => /foto/i.test(h)) || "",
    });
  }

  return {
    id,
    name,
    ageText: values["Yaş"] || "",
    birthDate: values["Doğ. Trh"] || values["Doğum"] || "",
    hp: values["Handikap P."] || values["Handikap"] || "",
    sire: values["Baba"] || "",
    sireId: hrefIn(rawValues["Baba"], "BabaId") || hrefIn(rawValues["Baba"], "AtId"),
    dam: (values["Anne"] || "").split("/")[0]?.trim() || "",
    damsire: (values["Anne"] || "").split("/")[1]?.trim() || "",
    trainer: values["Antrenör"] || "",
    trainerId: hrefIn(rawValues["Antrenör"], "AntrenorId"),
    owner: values["Gerçek Sahip"] || values["Sahip"] || "",
    ownerId: hrefIn(rawValues["Gerçek Sahip"] || rawValues["Sahip"], "SahipId"),
    runningOwner: values["Üzerine Koşan Sahip"] || "",
    breeder: values["Yetiştirici"] || "",
    color: values["Renk"] || "",
    sex: values["Cinsiyet"] || "",
    career,
    races,
  };
}

// Jokey istatistik tablosu (dönemsel: bu yıl / geçen yıl / kariyer gibi
// satırlar). Grok'un orijinal parser'ı yalnızca ilk uygun satırı alıyordu;
// burada tüm dönemleri topluyoruz ki jokey profilinde kariyer detayı olsun.
export function parseJockeyStats(html) {
  const periods = [];
  let bio = { name: "", licenseType: "", birthDate: "", city: "" };

  const values = normalizedValues(html);
  if (Object.keys(values).length) {
    bio = {
      name: pick(values, "isim", "adsoyad", "ad", "jokey", "jokeyadi", "binici"),
      licenseType: pick(values, "lisans", "lisanssinifi", "sinif", "lisansdurumu", "kategori", "unvan"),
      birthDate: pick(values, "dogtrh", "dogumtarihi", "dogum", "dogumyili"),
      city: pick(values, "bolge", "sehir", "il", "baglioldugusehir", "merkez", "hipodrom"),
    };
  }

  for (const table of tablesOf(html)) {
    for (const row of rowsOf(table)) {
      const cells = cellsOf(row).map((c) => c.text);
      if (cells.length < 8) continue;
      if (/jokey/i.test(cells[0] || "") && /koşu/i.test(cells[1] || "")) continue;
      if (!cells[0]) continue;
      periods.push({
        label: cells[0] || "",
        starts: cells[1] || "",
        first: cells[2] || "",
        second: cells[3] || "",
        third: cells[4] || "",
        fourth: cells[5] || "",
        fifth: cells[6] || "",
        winPct: cells[7] || "",
        placePct: cells[8] || "",
        showPct: cells[9] || "",
      });
    }
  }

  const total = periods.find((p) => /toplam|kariyer|tüm/i.test(p.label)) || periods[0] || null;

  return {
    name: bio.name,
    licenseType: bio.licenseType,
    birthDate: bio.birthDate,
    city: bio.city,
    periods,
    starts: total?.starts || "",
    first: total?.first || "",
    second: total?.second || "",
    third: total?.third || "",
    fourth: total?.fourth || "",
    fifth: total?.fifth || "",
    winPct: total?.winPct || "",
    placePct: total?.placePct || "",
    showPct: total?.showPct || "",
  };
}

// Antrenör / sahip / yetiştirici sayfaları da aynı "AtKosuBilgileri" şablonunu
// paylaşıyor: kimlik bilgisi span'leri + istatistik tablosu + at listesi.
export function parsePersonPage(html) {
  const norm = normalizedValues(html);
  const horses = [];
  for (const table of tablesOf(html)) {
    for (const row of rowsOf(table)) {
      const cells = cellsOf(row);
      if (cells.length < 3) continue;
      const horseHref = cells.flatMap((c) => c.hrefs).find((h) => /AtId=/i.test(h));
      if (!horseHref) continue;
      const horseId = queryParam(horseHref, "AtId");
      const name = cells.find((c) => c.hrefs.some((h) => /AtId=/i.test(h)))?.text || "";
      if (horseId && name && !horses.some((h) => h.id === horseId)) {
        horses.push({ id: horseId, name });
      }
    }
  }
  return {
    name: pick(norm, "isim", "adsoyad", "ad", "antrenor", "sahip", "unvan", "yetistirici"),
    horses,
  };
}

export function extractMp4(html) {
  const urls = html.match(/https?:\/\/[^"'<\s]+?\.(?:mp4)/gi) || [];
  const preferred =
    urls.find((u) => /video-cdn\.tjk\.org|tjk-vod/i.test(u) && !/_m\.mp4/i.test(u)) ||
    urls.find((u) => /video-cdn\.tjk\.org|tjk-vod/i.test(u)) ||
    urls[0] ||
    "";
  return preferred;
}
