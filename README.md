# Ganian — Türkiye At Yarışları

Türkiye genelindeki tüm at yarışı programlarını ve sonuçlarını gösteren, TJK'nın
herkese açık kaynaklarından veri çeken, bağımsız bir web uygulaması.

Bağımsız Node/Express + React/Vite yığını üzerine kurulmuştur; herhangi bir platforma
bağımlılığı yoktur (kendi auth, kendi deploy altyapısı, üçüncü taraf servis gerektirmez).

## Özellikler

### Program ve koşular
- Günlük yarış programı: tüm Türkiye hipodromları (İstanbul, İzmir, Ankara, Bursa,
  Adana, Antalya, Kocaeli, Şanlıurfa, Elazığ, Diyarbakır) + yurt dışı toplantılar
  ayrı sekmede
- Her koşuda: pist tipi (çim / kum / sentetik), mesafe, grup, ikramiye, hava durumu
  ve pist bilgisi (çim/kum derinliği, sıcaklık, nem)
- Koşu atları: program no, kulvar, kilo, ek kilo, apranti indirimi, HP, son 6'lı
  form, ganyan, AGF yüzdesi, takılar, çiftiska durumu

### At ve jokey profilleri
- At profil: yaş/renk/cinsiyet, HP (handikap puanı), baba/anne/anne baba,
  antrenör ve sahip (profillerine link), kariyer istatistiği (dönem bazlı K/1/2/3
  ve kazanç), **tüm geçmiş koşuları** — her birinde o gün taşıdığı kilo, HP, jokey,
  derece, kaçıncı olduğu ve **koşu videosunu izleme linki**
- Jokey profil: lisans tipi, doğum tarihi, dönemsel istatistik, son 10 günün tüm
  binişleri (kilo, HP, sıra, video)
- Antrenör / sahip profil: TJK sayfasından ilişkili atların listesi

### İstatistik ve grafikler
- **HP puanı zaman grafiği** — atın handikap puanının koşu koşu nasıl değiştiğini
  gösteren grafik
- **Zemin ve mesafe performansı** — hem at hem jokey profilinde: çim/kum/sentetik
  zeminlerdeki ve kısa/orta/uzun mesafelerdeki ayrı kazanma oranları, en az 5
  koşu şartıyla belirlenen "en iyi zemin" ve "en iyi mesafe"
- **Favori zemin/mesafe vurgusu** — günlük programda, bir at veya jokey o gün
  kendi en iyi olduğu zeminde ya da mesafede koşuyorsa ismi **sarı** renkte
  vurgulanır
- **Jokey-at ikilisi geçmişi** — at profilinde, o atla en çok binen jokeylerin
  birlikte kaç koşuya çıktığı ve kaçını kazandığı
- **Kardeş atlar** — aynı babadan gelen diğer atların listesi (TJK'nın resmi
  pedigri sorgusu, bulunamazsa son 30 günün programından yedek arama)

### Kupon ve karşılaştırma
- **Kupon oluşturucu** — 18 farklı bahis türü (Ganyan, Plase, İkili, Üçlü, Tabela,
  6'lı/7'li Ganyan vb.) için çok ayağlı veya tek ayağa kupon kurma; koşulardan
  seçilen atları birleşik kupon olarak oluşturma ve takip listesine ekleme
- **Karşılaştırma sayfası** — iki atı yan yana karşılaştırma (HP, istatistik,
  zemin/mesafe performansı, daha önce aynı koşuda yarışıp yarışmadıkları)
- **Liderlik tablosu** — son 7/30/90 günde en çok kazanan jokey ve antrenörler

### Takip ve paylaşım
- Favoriler: at ve jokeyleri takip listesine ekleme (cihazda saklanır, sunucuya
  gitmez) + **favori bir at bugün koşuyorsa ana sayfada hatırlatma banner'ı**
- Arama: at / jokey / antrenör / sahip ismiyle canlı arama
- Sonuçlar sayfası: sonuçlanmış koşuları podyum (1-2-3) görünümünde özetler
- **Paylaş ve yazdır** — her at/jokey sayfasında bağlantı paylaşma (Web Share API,
  desteklenmiyorsa panoya kopyalama) ve yazdırmaya uygun görünüm

### Arayüz
- Tamamen mobil ve masaüstü uyumlu responsive tasarım
- Terminal sınıfı performans: tüm TJK istekleri sunucu tarafında cache'lenir

## Mimari

```
server/                Express API — TJK'ya server-side istek atar (CORS/robots
                         engelini aşmak ve güvenli olmayan bilgi sızdırmamak için
                         istemci doğrudan TJK'ya istek atmaz)
  tjk/format.mjs         tarih, pist, mesafe kovası, isim yardımcı fonksiyonları
  tjk/parseHtml.mjs      TJK HTML sayfalarını (at/jokey/antrenör/sahip) parse eder
  tjk/stats.mjs          zemin/mesafe bazlı kazanma oranı hesaplama
  tjk/client.mjs         ebayi.tjk.org JSON + tjk.org HTML kaynaklarını birleştirir,
                         bellek içi cache uygular
  index.mjs              API endpoint'leri + üretimde derlenmiş frontend'i sunar

src/                    React (Vite + react-router-dom + Tailwind) frontend
  components/           paylaşılan UI parçaları (RaceCard, Silk, VideoDialog, ...)
  pages/                sayfalar (HomePage, ResultsPage, HorsePage, JockeyPage, ...)
  lib/                  API istemcisi, tipler, tarih/biçim yardımcıları, favoriler,
                         kupon yapıları
```

### Veri akışı

1. `GET /api/gun/:tarih?bolge=tr|dunya|all` → `ebayi.tjk.org/s/d/program/…` ve
   `…/sonuclar/…` JSON'larını birleştirir, günün tüm toplantılarını ve koşularını
   döner.
2. `GET /api/at/:id` → `tjk.org/.../AtKosuBilgileri?QueryParameter_AtId=...`
   sayfasını HTML olarak çekip parse eder (kimlik bilgisi + kariyer istatistiği +
   koşu geçmişi tablosu).
3. `GET /api/jokey/:id` → jokey istatistik sayfasını parse eder, ayrıca son 10
   günün programını tarayarak o jokeye ait tüm binişleri toplar (TJK'nın jokey
   sayfası her zaman güncel/detaylı biniş listesi vermediği için bu tamamlayıcı
   bir yöntemdir).
4. `GET /api/kisi/:antrenor|sahip/:id` → aynı sorgu şablonunu antrenör/sahip
   kimliğiyle çeker.
5. `GET /api/video/:atId/:kosuKod` → koşu video sayfasından doğrudan mp4 linkini
   çıkarır; bulunamazsa TJK'nın video sayfasına yönlendirir.
6. `GET /api/ara?q=...` → son 5 günün programını tarayarak isim eşleşmesi arar.
7. `GET /api/at/:id/kardesler` → atın babasının ID'sini bulup TJK'nın resmi
   "aynı babadan atlar" sorgusunu çeker; ID bulunamazsa son 30 günün
   programında aynı baba adına sahip atları arayarak yedek bir liste üretir.
8. `GET /api/liderlik?gun=7|30|90` → seçilen gün aralığındaki tüm koşuları
   tarayıp jokey ve antrenörleri galibiyet sayısına göre sıralar.
9. `GET /api/oz/atlar?ids=...` ve `GET /api/oz/jokeyler?ids=...` → günlük
   programdaki atların/jokeylerin "en iyi zemini" ve "en iyi mesafesi"ni toplu
   olarak döner; frontend bunu her koşunun kendi zemin/mesafesiyle karşılaştırıp
   eşleşenleri sarı renkte vurgular.

Zemin/mesafe istatistikleri (`tjk/stats.mjs`) bir at veya jokeyin sonuçlanmış
koşularını çim/kum/sentetik ve kısa/orta/uzun mesafe kovalarına ayırıp
kazanma oranı hesaplar; bir zemin veya mesafenin "en iyi" sayılabilmesi için
en az 5 koşu şartı aranır (aksi halde 1 koşuda 1 galibiyet %100 gibi yanıltıcı
görünür).

Tüm TJK istekleri sunucu tarafında (Node) yapılır ve 45 saniye ile 5 dakika
arasında değişen sürelerle bellek içinde cache'lenir, böylece aynı veri kısa
sürede tekrar tekrar TJK'ya gitmeden servis edilir.

## Kurulum

Node.js 18+ gerekir (test ortamı Node 22 ile hazırlandı).

```bash
npm install
```

### Geliştirme

İki terminal gerekir: biri API sunucusu, biri Vite dev sunucusu (Vite, `/api`
isteklerini otomatik olarak Express'e proxy'ler — bkz. `vite.config.ts`).

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

### Üretim derlemesi

```bash
npm run build      # dist/ klasörüne derler
npm run server     # Express hem /api'yi hem dist/'i tek portta (8787) sunar
```

Ardından `http://localhost:8787` adresinden tüm site (API + frontend) tek
sunucudan servis edilir. `PORT` ortam değişkeniyle portu değiştirebilirsiniz.

## 🌊 Ultra Analiz

Analiz kutusundaki derinlik seçiminde **ULTRA** seviyesi: koşu başlamadan 5 dakika
öncesine kadar kesintisiz, birikimli ve akıllı web araştırması.

- **Akıllı zamanlayıcı:** koşuya kalan süreye göre tur aralığı (4 sa+ → 30 dk,
  1-4 sa → 15 dk, 30-60 dk → 7 dk, <30 dk → 3 dk); son tur koşu -5 dk'da.
- **Birikimli:** her tur yalnızca YENİ bilgi arar (bilinenler prompt'a girer,
  tekrar etme yasak); bulgular kronolojik arşivde üst üste birikir, tekrarlar
  filtrelenir, özet şişerse sıkıştırılır.
- **Kaynak rotasyonu:** son dakika/resmi duyurular → jokey & takı → pist & hava →
  uzman yorumları → AGF/bahis oranı hareketleri, sırayla taranır.
- **Nihai mega rapor:** koşu -5 dk'da tüm birikmiş veri + koşu profili tek mega
  prompt olarak ana modele gider (yüksek çaba) → rapor depoya "ULTRA" etiketiyle
  kaydedilir ve bot kuponu otomatik kurulur.
- **Dayanıklı:** oturum durumu cihazda saklanır; sayfa yenilense/bilgisayar
  kapansa bile kaldığı yerden devam eder. Tarayıcıda çalışır (sekme açık kalmalı).
- **Sağlık:** 5 üst üste hata → oturum durur, sebep gösterilir; nihai rapor
  başarısızsa birikmiş bulgular "yarım rapor" olarak saklanır.

## Sanal Bahis Botu (v1.2)Uygulamada **an-be-an çalışan bir bahis botu** vardır (`server/bot.mjs`). Analiz ve
araştırma hattına dokunmaz; onların çıktısını tüketir:

- Her koşu için analistin rapor sonundaki **"## 🤖 Bot Verisi"** JSON bloğunu okur
  (banko / sürpriz / bomba + sıralama + yüzde) ve **16 sanal bahis** kurar:
  4 ganyan + 6 ikili (sıralı, sürpriz at kombinasyonları dahil) + 6 üçlü
  (sıralı: 1-2-3 / 1-3-2 / 2-1-3 + sürpriz at her pozisyonda).
- Sonuçlanan koşularda bahisleri değerlendirir; ilk-3 ve banko isabetini ölçer.
- **Kaynak öğrenmesi:** araştırma özetindeki uzman tablosu, at isabeti bazında
  domain istatistiğine çevrilir (server/data/bot/weights.json) ve araştırma
  prompt'larına "GEÇMİŞ İSABET TABLOSU" olarak geri beslenir — sık tutturan
  kaynağa Yüksek, tutmayan kaynağa Düşük ağırlık verme talimatı otomatik eklenir.
- Site: `/bot` sayfası — duraklat/başlat, manuel tarama, isabet tabloları.
- Ayarlar (.env): `BOT_ENABLED`, `BOT_MODEL` (varsayılan gpt-5-mini),
  `BOT_EFFORT` (low), `BOT_DEPTH` (orta), `BOT_INTERVAL_MIN` (20),
  `BOT_MAX_RACES_PER_DAY` (40), `BOT_START_WINDOW_H` (14).
- Bahisler **sanaldır** (paper trading): TJK'nın yasal otomatik bahis API'si yok;
  motor kayıt + öğrenme yapar, para harcamaz.
- Prompt tek kaynağı `shared/prompt.ts`: istemci ve bot aynı talimat modülünü
  kullanır (sürüklenme/drift önlenmiş).

## Bilinen kısıtlar ve notlar- **TJK'nın HTML yapısı değişebilir.** `parseHtml.mjs` içindeki hücre indeksleri
  (`cells[8]`, `cells[14]` gibi) TJK'nın mevcut tablo sırasına göre yazıldı.
  TJK sitesini güncellerse bu indekslerin yeniden ayarlanması gerekebilir. Kod,
  her bir alanın boş gelmesi durumunda çökmeyecek şekilde savunmacı yazıldı;
  ancak sıra tamamen değişirse yanlış sütuna denk gelebilir.
- TJK, otomatik erişime karşı `robots.txt` ile bazı yolları engelliyor olabilir;
  bu genelde arama motoru botlarını hedefler ve normal bir sunucu isteğini
  (bu projenin yaptığı gibi, gerçek bir tarayıcı User-Agent'ıyla) engellemez,
  ancak TJK ileride IP/oran sınırlaması getirirse `server/tjk/client.mjs`
  içindeki `fetchText` fonksiyonuna yeniden deneme/backoff eklemek gerekebilir.
- Video linkleri TJK'nın video sayfasından mp4 URL'si çekilerek elde edilir;
  TJK bu CDN yapısını değiştirirse `extractMp4` fonksiyonunun güncellenmesi
  gerekir. Video bulunamadığında kullanıcı otomatik olarak TJK'nın kendi video
  sayfasına yönlendirilir, böylece özellik tamamen kırılmaz.
- **Mesafe kovaları (kısa/orta/uzun) TJK'nın resmi bir sınıflandırması değil.**
  Türkiye'de yaygın koşu mesafeleri (1000-3200 m) göz önünde bulundurularak
  makul bir bölüm yapıldı: kısa ≤1400 m, orta 1401-2000 m, uzun >2000 m.
  Gerçek bir jokeyin/kullanıcının kullandığı eşiklerle birebir örtüşmeyebilir.
- **Favori zemin/mesafe vurgusu** için her toplantıdaki tüm atların TJK
  profilini çekmek gerekiyor; bu nedenle sarı vurgular sayfa ilk açıldığında
  değil, arka plan isteği tamamlandığında (birkaç saniye içinde) görünür.
  İlk 80 at/jokey ile sınırlıdır (`MAX_BATCH_IDS`), çok kalabalık toplantılarda
  bazı isimler değerlendirmeye alınmayabilir.
- **Kardeş atlar** özelliği TJK'nın `QueryParameter_BabaId` sorgusuna dayanıyor;
  bu parametrenin gerçekten var olduğu doğrulandı, ancak atın kendi profil
  sayfasında babanın ID'sinin her zaman bir link olarak verilip verilmediği
  canlı test edilemedi. ID bulunamazsa otomatik olarak son 30 günün
  programından isim eşleştirmeli bir yedek listeye düşer (arayüzde bu durum
  ayrıca belirtilir).

## Lisans

MIT License — serbest kullanım, değiştirme ve dağıtım.
