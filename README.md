# Ganian — Türkiye At Yarışları

Türkiye genelindeki tüm at yarışı programlarını ve sonuçlarını gösteren, TJK'nın
herkese açık kaynaklarından veri çeken, bağımsız (Grok/başka bir platforma bağımlı
olmayan) bir web uygulaması.

Bu proje daha önce Grok ile başlatılmış bir prototipin devamıdır: Grok'un TJK veri
çekme mantığı incelenip hataları düzeltilerek, Grok'un platformuna özgü altyapıdan
(kendi auth sistemi, kendi "multiplayer" servisi, kendi deploy mekanizması)
tamamen bağımsız, sade bir Node/Express + React yığına yeniden kuruldu.

**Proje adı:** Ganian (eski adı: Mahmuz)

## Özellikler

- Günlük yarış programı: tüm Türkiye hipodromları (İstanbul, İzmir, Ankara, Bursa,
  Adana, Antalya, Kocaeli, Şanlıurfa, Elazığ, Diyarbakır) + yurt dışı toplantılar
  ayrı sekmede
- Her koşuda: pist tipi (çim / kum / sentetik), mesafe, grup, ikramiye, hava durumu
  ve pist bilgisi (çim/kum derinliği, sıcaklık, nem)
- At tıklanınca: yaş/renk/cinsiyet, HP (handikap puanı), baba/anne/anne baba,
  antrenör ve sahip (profillerine link), kariyer istatistiği (dönem bazlı K/1/2/3/4/5
  ve kazanç), **tüm geçmiş koşuları** — her birinde o gün taşıdığı kilo, HP, jokey,
  derece, kaçıncı olduğu ve **koşu videosunu izleme linki**
- **HP puanı zaman grafiği** — atın handikap puanının koşu koşu nasıl değiştiğini
  gösteren bir grafik
- **Zemin ve mesafe performansı** — hem at hem jokey profilinde: çim/kum/sentetik
  zeminlerdeki ve kısa/orta/uzun mesafelerdeki ayrı kazanma oranları, en az 3
  koşu şartıyla belirlenen "en iyi zemin" ve "en iyi mesafe"
- **Favori zemin/mesafe vurgusu** — günlük programda, bir at veya jokey o gün
  kendi en iyi olduğu zeminde ya da mesafede koşuyorsa ismi **sarı** renkte
  vurgulanır
- **Jokey-at ikilisi geçmişi** — at profilinde, o atla en çok binen jokeylerin
  birlikte kaç koşuya çıktığı ve kaçını kazandığı
- **Kardeş atlar** — aynı babadan gelen diğer atların listesi (TJK'nın resmi
  pedigri sorgusu, bulunamazsa son 30 günün programından yedek arama)
- **Karşılaştırma sayfası** — iki atı yan yana karşılaştırma (HP, istatistik,
  zemin/mesafe performansı, daha önce aynı koşuda yarışıp yarışmadıkları)
- **Liderlik tablosu** — son 7/30/90 günde en çok kazanan jokey ve antrenörler
- Jokey tıklanınca: aynı derinlikte profil — lisans tipi, doğum tarihi, dönemsel
  istatistik, son 10 günün tüm binişleri (kilo, HP, sıra, video), zemin/mesafe
  performansı
- Antrenör / sahip profili: TJK sayfasından ilişkili atların listesi
- Sonuçlar sayfası: sonuçlanmış koşuları podyum (1-2-3) görünümünde özetler
- Arama: at / jokey / antrenör / sahip ismiyle canlı arama
- Favoriler: at ve jokeyleri takip listesine ekleme (cihazda saklanır, sunucuya
  gitmez) + **favori bir at bugün koşuyorsa ana sayfada hatırlatma banner'ı**
- **Paylaş ve yazdır** — her at/jokey sayfasında bağlantı paylaşma (Web Share API,
  desteklenmiyorsa panoya kopyalama) ve yazdırmaya uygun görünüm
- Tamamen mobil ve masaüstü uyumlu responsive tasarım

## Mimari

```
server/                Express API — TJK'ya server-side istek atar (CORS/robots
                         engelini aşmak ve tarayıcıya anahtar/gizli bilgi
                         sızdırmamak için istemci doğrudan TJK'ya istek atmaz)
  tjk/format.mjs         tarih, pist, mesafe kovası, isim yardımcı fonksiyonları
  tjk/parseHtml.mjs      TJK HTML sayfalarını (at/jokey/antrenör/sahip) parse eder
  tjk/stats.mjs          zemin/mesafe bazlı kazanma oranı hesaplama
  tjk/client.mjs         ebayi.tjk.org JSON + tjk.org HTML kaynaklarını birleştirir,
                         bellek içi cache uygular
  index.mjs              API endpoint'leri + üretimde derlenmiş frontend'i sunar

src/                    React (Vite + react-router-dom + Tailwind) frontend
  components/           paylaşılan UI parçaları (RaceCard, Silk, VideoDialog, ...)
  pages/                sayfalar (HomePage, ResultsPage, HorsePage, JockeyPage, ...)
  lib/                  API istemcisi, tipler, tarih/biçim yardımcıları, favoriler
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

## Bilinen kısıtlar ve notlar

- **TJK'nın HTML yapısı değişebilir.** `parseHtml.mjs` içindeki hücre indeksleri
  (`cells[8]`, `cells[14]` gibi) TJK'nın mevcut tablo sırasına göre yazıldı.
  TJK sitesini güncellerse bu indekslerin yeniden ayarlanması gerekebilir. Kod,
  her bir alanın boş gelmesi durumunda çökmeyecek şekilde savunmacı yazıldı;
  ancak sıra tamamen değişirse yanlış sütuna denk gelebilir.
- Bu ortamda `npm install` çalıştırılamadığı (dışa ağ erişimi kapalı) için gerçek
  bir `npm run build` alınıp doğrulanamadı. Kod TypeScript kurallarına göre elle
  ve bağımlılıksız bir `tsc` taramasıyla gözden geçirildi; kalan tek tip
  uyarıları React'ın `key` özel prop'una dair olup `@types/react` kurulunca
  otomatik çözülen bilinen bir durumdur.
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
  Gerçek bir jokeyin/uzmanın kullandığı eşiklerle birebir örtüşmeyebilir.
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

## Grok'un orijinal koduna göre yapılan düzeltmeler / eklemeler

- `isDomesticMeeting` fonksiyonundaki ölü kod bloğu düzeltildi (yurt içi/yurt
  dışı ayrımı önceden hiçbir zaman doğru çalışmıyordu).
- Jokey profiline doğum tarihi, lisans tipi ve şehir bilgisi eklendi; önceden
  yalnızca istatistik tablosu çekiliyordu.
- Antrenör ve sahip profil sayfaları eklendi (TJK aynı sorgu şablonunu bu
  kimlikler için de kullanıyor, önceden hiç kullanılmıyordu).
- At profilinde antrenör/sahip/baba ID'leri hiç çekilmiyordu (hep boş
  bırakılmıştı); artık bu linkler çıkarılıp ilgili profillere yönlendiriliyor.
- HTML parse katmanına ikinci bir yakalama yöntemi (`dt/dd` etiket çiftleri)
  eklendi; TJK sayfası `span.key/value` yerine tanım listesi kullanırsa da
  veri boş dönmeyecek.
- Favoriler (takip listesi) özelliği eklendi.
- Arama artık antrenör ve sahipleri de kapsıyor.
- **Zemin/mesafe bazlı kazanma oranı analizi** (hem at hem jokey için),
  **HP puanı zaman grafiği**, **jokey-at ikilisi geçmişi**, **kardeş atlar**,
  **jokey/antrenör liderlik tablosu**, **iki atı karşılaştırma sayfası**,
  **favori at bugün koşuyor hatırlatması** ve **paylaş/yazdır** özellikleri
  eklendi.
- Tüm kod, Grok'un platformuna özgü altyapıdan (auth, multiplayer, kendi
  deploy sistemi) bağımsız hale getirildi.

## Lisans

MIT License — serbest kullanım, değiştirme ve dağıtım.