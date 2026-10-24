# Ultra Analiz — Tasarım Şartnamesi

**Tarih:** 2026-10-24 · **Durum:** Onay bekliyor · **Sahip:** Ganian

## 1. Amaç

Kullanıcı, bir koşu için "ULTRA" derinliğini seçtiğinde sistem; koşunun başlangıç
saatinin 5 dakika öncesine kadar **kesintisiz, akıllı ve birikimli web araştırması**
yapar. Araştırma sırasında elde edilen her yeni bulgu bir arşivde üst üste birikir
(baştan başlamaz, "üstüne katar"). Koşu başlamadan 5 dakika önce tüm birikmiş veri
tek bir mega prompt olarak ana modele gönderilir ve model nihai raporu üretir.
Rapor depoya kaydedilir ve bot kuponu otomatik kurulur.

**Başarı kriterleri:**
- Kullanıcı butonu bastıktan sonra hiçbir elle müdahale gerekmez; döngü koşu -5 dk'ya kadar çalışır.
- Her araştırma turu yalnızca YENİ bilgi arar; bilinenleri tekrar etmez.
- Sayfa yenilense/bilgisayar kapanıp açılsa bile oturum kaldığı yerden devam eder.
- Nihai rapor Analizler sayfasında görünür ve bot kuponu otomatik kurulur.

## 2. Kapsam ve yerleşim

- **Çalışma ortamı:** Tarayıcı (kullanıcı seçimi). Mevcut iş altyapısına paralel,
  bağımsız modül: `src/lib/ultraRunner.ts`.
- **Arayüz:** Analiz kutusundaki derinlik seçimine 4. seviye `ULTRA` eklenir.
- **Sunucu değişikliği yok:** Tüm araştırma mevcut `/api/analiz/arastirma` uç
  noktası üzerinden gider. Not: sunucu yalnızca `dusuk/orta/yuksek` derinliğini
  tanır; `ultra` **istemci tarafı bir moddur** — her tur sunucuya `depth: "yuksek"`
  gönderir. Nihai rapor mevcut `/api/analiz` + `/api/analizler/kaydet` +
  `/api/bot/veri` uçlarını kullanır.

## 3. Ultra oturumu yaşam döngüsü

`startUltra({apiKey, meeting, race, model, effort})`:

1. Aynı `raceKey` için zaten aktif oturum varsa mevcutu döner.
2. Koşu tarihi/saati çözülür (`race.date` + `race.time`, Europe/Istanbul).
   Çözülemiyorsa hata ile reddedilir (kullanıcıya bildirilir).
3. Faz `temel` başlar: tam kapsamlı araştırma turu hemen çalışır.
4. Sonuç `localStorage["ultra:oturumlar"]`'a yazılır; her durum değişiminde
   (kısılmış) güncellenir.

**Fazlar:** `temel` → `takip` (tekrar eden turlar) → `nihai` (mega rapor) → `bitti`.

**Bitiş koşulları:**
- `now >= raceTime - 5 dk` ve çalışan tur bittiğinde → `nihai` faz.
- `now > raceTime` → oturum otomatik iptal edilir ("koşu başladı").
- Kullanıcı "Durdur" derse oturum iptal edilir; birikmiş veri saklanır.

## 4. Akıllı zamanlayıcı

Kalan süreye göre tur aralığı:

| Kalan süre | Tur aralığı |
|---|---|
| ≥ 4 saat | 30 dk |
| 1 – 4 saat | 15 dk |
| 30 – 60 dk | 7 dk |
| < 30 dk | 3 dk |

- Son tur: `raceTime - 5 dk` civarında zorunlu olarak yapılır; bitince `nihai`.
- Koşu saati bilinmiyorsa: sabit 20 dk aralık; kullanıcı dilediği an durdurabilir.
- Tur sürerken bitiş zamanı gelirse: turun bitmesi beklenir, sonra `nihai`.

## 5. Araştırma turları

**Faz `temel` (tek sefer):** Mevcut en geniş prompt seti (`yuksek` derinlik):
`buildResearchPromptSonDakika` + `buildResearchPromptUzman` paralel; sonucu
oturumun "bilinenler" özetine eklenir.

**Faz `takip` (her tur):** Tur prompt'u şunu içerir:
- Koşu künyesi (şehir, koşu no, tarih, saat, mesafe, pist, atlar)
- Güncel "bilinenler" özeti (birikmiş bulguların sıkıştırılmış hali)
- Talimat: *"Bilinenleri tekrar etme; SADECE listede olmayan yeni gelişmeleri
  ara: koşudan çıkma, jokey değişikliği, takı değişikliği, sakatlık, ahır
  haberi, pist/hava değişimi, yeni uzman yorumu, bahis oranı hareketi."*

**Kaynak rotasyonu:** Turlar tek açıya takılmaz; sırayla bu açılar taranır:
son dakika/resmi duyurular → jokey & takı değişiklikleri → pist & hava →
uzman yorumları → AGF/bahis oranı hareketleri.

**Birikme ve tekrar filtresi:** Her turun çıktısı, önceki bulgularla normalleştirilmiş
cümle-benzerliği ile karşılaştırılır; tekrarlar atılır, yeniler özete kronolojik
olarak eklenir. Birikmiş özet 8.000 kelimeyi aşarsa en eski bloklar nano özetçiyle
sıkıştırılır; sunucu nano özetçi kotasız/bozuk ise en eski ham bloklar düşürülür
(nihai raporda "kaybolan eski turlar" notuyla belirtilir).

## 6. Nihai mega rapor (koşu -5 dk)

Mega prompt içeriği:
1. Analist talimatı (mevcut `ANALIST_TALIMATI`) — son duruma göre karar verme talimatıyla
2. Koşu profili + at/jokey blokları + liderlik formu + pedigri (mevcut `buildRaceAnalysisPrompt`)
3. **Ultra arşiv bölümü:** tüm turların kronolojik birikmiş bulguları
4. Talimat: *"Tüm turların bulgularını birleştir; son 5 dakikadaki durum itibarıyla
   nihai değerlendirmeyi ver. Erken turlardaki bilgi ile son durum çelişirse son
   durumu esas al ve farkı belirt."*

Çıktı akışı: `callGpt` (seçilen model, yüksek çaba) → `saveAnalysisRemote`
(`kaynak: "ultra"`) → `extractBotVeri` → `/api/bot/veri` (kupon) → bildirim.

## 7. Arayüz

- **Analiz kutusu:** Derinlik seçiminde `ULTRA` seçeneği; yanında uyarı:
  *"Koşu başlamadan 5 dk öncesine kadar sürekli araştırma yapılır; saatler
  sürebilir ve çok sayıda sorgu harcanır."*
- **Canlı görünüm:** Oturum aktifken ilerleme satırı: `Tur 7 · Koşuya 48 dk ·
  Sonraki tur 14:32 · Yeni bulgu: "6 no'lu atın jokeyi değişti"`. Tur kayıtları
  (zaman + başlık) açılıp incelenebilir.
- **Bildirim:** Nihai rapor hazır olunca `notifyDone` ile sistem bildirimi.
- **Durdurma:** "Durdur" düğmesi oturumu iptal eder; birikmiş veri saklanır.

## 8. Hata yönetimi

- **Tur hatası** (ağ/limit/boş): oturum ölmez; aynı tur bir sonraki zamanlamada
  tekrar denenir. Üst üste 3 tur hatası → aralık 2 katına çıkar (geri çekilme).
- **Nihai rapor hatası:** 1 kez yeniden denenir; yine başarısızsa birikmiş
  özet "yarım ultra raporu" olarak depoya kaydedilir (veri kaybı olmaz).
- **Depolama hatası:** Oturum localStorage'a yazılamazsa döngü çalışmaya devam
  eder ama "dayanıklılık kapalı" uyarısı gösterilir.

## 9. Test

- **Birim:** zamanlayıcı aralık hesabı (kalan süreye göre), kesim zamanı
  (`raceTime - 5 dk`), bulgu tekrar filtresi, mega prompt birleştirme.
- **Entegrasyon (elle):** sahte yakın saatli koşu ile oturum → turlar → final
  rapor → depo + kupon; sayfa yenileme ile oturumun devam ettiğinin görülmesi.

## 10. Etkilenen dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/lib/ultraRunner.ts` | YENİ — oturum durumu, zamanlayıcı, turlar, mega rapor |
| `shared/prompt.ts` | YENİ — ultra artımlı tur prompt'u + nihai mega prompt bölümü |
| `src/lib/gpt.ts` | `ArastirmaDerinlik` tipine `"ultra"`; `getArastirmaDerinlik` günceller |
| `src/lib/types.ts` | `SavedAnalysis.kaynak` tipine `"ultra"` eklenir |
| `src/lib/analysisRunner.ts` | `runJobBody` ultra derinliği ayrı yola yönlendirir |
| `src/components/AnalysisDialog.tsx` | ULTRA seçeneği + uyarı + canlı oturum görünümü + Durdur |
