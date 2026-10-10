import { getHorseProfile, getJockeyProfile } from "./api";
import type { HorseProfile, JockeyProfile, Meeting, Race } from "./types";

export const GPT_MODEL = "gpt-6-sol";
export const GPT_MODELS = [
  { id: "gpt-6-sol", label: "GPT-6 Sol (önerilen, dengeli)" },
  { id: "gpt-6-luna", label: "GPT-6 Luna (hızlı + en ucuz)" },
  { id: "gpt-6-astra", label: "GPT-6 Astra (en isabetli, pahalı)" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol (amiral)" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra (dengeli)" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna (hızlı + ucuz)" },
  { id: "gpt-5.5", label: "GPT-5.5 (en yeni amiral)" },
  { id: "gpt-5.4", label: "GPT-5.4" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
  { id: "gpt-5.1", label: "GPT-5.1" },
  { id: "gpt-5", label: "GPT-5" },
  { id: "gpt-5-mini", label: "GPT-5 Mini (hızlı + ucuz)" },
  { id: "gpt-5-nano", label: "GPT-5 Nano (en hızlı/ucuz)" },
  { id: "gpt-5-pro", label: "GPT-5 Pro (en isabetli)" },
  { id: "gpt-5-chat-latest", label: "GPT-5 Chat (sohbet)" },
  { id: "gpt-4.1", label: "GPT-4.1 (klasik, akıl yürütmesiz)" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { id: "gpt-4o", label: "GPT-4o (güvenilir)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini (en ucuz klasik)" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo (eski)" },
  { id: "gpt-4", label: "GPT-4 (eski)" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (eski, ucuz)" },
  { id: "o3", label: "o3 (akıl yürütme)" },
  { id: "o3-mini", label: "o3-mini (akıl yürütme)" },
  { id: "o4-mini", label: "o4-mini (akıl yürütme)" },
  { id: "gpt-oss-120b", label: "gpt-oss-120b (açık ağırlık)" },
  { id: "gpt-oss-20b", label: "gpt-oss-20b (açık ağırlık)" },
] as const;
export const GPT_MODEL_STORAGE = "mahmuz:gpt-model";
export const GPT_EFFORTS = [
  { id: "none", label: "None (muhakemesiz, en hızlı)" },
  { id: "minimal", label: "Minimal (en hızlı, en az kesinti)" },
  { id: "low", label: "Low (önerilen)" },
  { id: "medium", label: "Medium (daha derin)" },
  { id: "high", label: "High (en derin, yavaş)" },
  { id: "xhigh", label: "XHigh (çok derin)" },
] as const;
export const GPT_EFFORT_STORAGE = "mahmuz:gpt-effort";

export function getGptEffort(): string {
  try {
    const v = (localStorage.getItem(GPT_EFFORT_STORAGE) || "").trim();
    if (GPT_EFFORTS.some((m) => m.id === v)) return v;
  } catch {
    /* yok say */
  }
  return "low";
}

export function setGptEffort(id: string) {
  try {
    localStorage.setItem(GPT_EFFORT_STORAGE, id);
  } catch {
    /* yok say */
  }
}

export function getGptModel(): string {
  try {
    const v = (localStorage.getItem(GPT_MODEL_STORAGE) || "").trim();
    // Listede yoksa bile özel ID'ye izin ver (yeni çıkan modeller için)
    if (v) return v;
  } catch {
    /* yok say */
  }
  return GPT_MODEL;
}

export function setGptModel(id: string) {
  try {
    localStorage.setItem(GPT_MODEL_STORAGE, id);
  } catch {
    /* yok say */
  }
}
export const GPT_KEY_STORAGE = "mahmuz:gpt-key";

export function getGptKey(): string {
  try {
    return localStorage.getItem(GPT_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setGptKey(key: string) {
  try {
    localStorage.setItem(GPT_KEY_STORAGE, key.trim());
  } catch {
    /* yok say */
  }
}

export function clearGptKey() {
  try {
    localStorage.removeItem(GPT_KEY_STORAGE);
  } catch {
    /* yok say */
  }
}

// ---------------------------------------------------------------------------
// Prompt: değişkenler (yarış / atlar / jokeyler / antrenörler) bu fonksiyonla
// doldurulur. Sabit talimat kısmı ANALIST_TALIMATI'nda durur.
// ---------------------------------------------------------------------------

const ANALIST_TALIMATI = `# ROL

Sen Türkiye at yarışları (TJK) üzerine uzmanlaşmış, profesyonel bir yarış analistisin.
Sahada yıllarca program okumuş, idman izlemiş, pist karakteri ve tempo senaryosu üzerinden
düşünen bir uzman gibi çalışırsın. Tüm çıktını akıcı ve teknik olarak doğru Türkçe yazarsın.

Bu analiz "Ganian" platformunda kullanıcıya gösterilecek. Hedef kitlen yarışı bilen ama
her detayı takip edemeyen kullanıcı: ona hem veriyi hem de veriden çıkan yorumu vereceksin.

Sen sadece başkalarının tahminlerini derleyen biri değilsin. Kendi bağımsız görüşünü
kurar, sonra piyasadaki uzman görüşleriyle karşılaştırır, tartar ve nihai kararı sen verirsin.

---

# ZAMAN VE DERİNLİK POLİTİKASI

Acele etme. Süre kısıtın yok.
- Araştırmayı yarıda bırakma, "yeterli" görünen ilk sonuçla yetinme.
- Gerekiyorsa aynı konu için birden fazla arama yap, farklı kelimelerle tekrar dene.
- Analizi kısaltmak için bir başlığı atlama. Kısa kesmek yerine doğru ve eksiksiz yaz.
- Uzman görüşü taramasında hedef sayıya ulaşmadan analize geçme.

---

# ÇALIŞMA SIRASI (BU SIRAYI BOZMA)

**Aşama A — Bağımsız analiz:** Önce yalnızca site verisi + Bölüm 2 araştırmasıyla
kendi görüşünü oluştur. Kendi 1-2-3-4 sıralamanı ve banko adayını zihninde belirle.
Bu aşamada henüz başka analistlerin tahminlerine BAKMA.

**Aşama B — Uzman taraması:** Bölüm 3'ü uygula; en az 10 güvenilir analistin tahminini topla.

**Aşama C — Tartma ve nihai karar:** Kendi görüşünle uzman görüşlerini karşılaştır,
ayrıştığın noktaları gerekçelendir, gerekirse sıralamanı revize et — ama sırf çoğunluk
öyle diyor diye değiştirme. Nihai sıralama senin kararın.

Bu sıra, başkalarının tahminine erken demirlemeni (anchoring) engellemek içindir.

---

# GİRDİ VERİSİ (Ganian / TJK kaynaklı)

## Koşu Künyesi
{{YARIS_BILGISI}}
<!-- hipodrom, şehir, tarih, koşu no, saat, mesafe, pist tipi (çim/kum/sentetik),
     grup/kategori, koşu türü, cinsiyet ve yaş şartı, ikramiye dağılımı -->

## Hava ve Pist Durumu
{{HAVA_VE_PIST_DURUMU}}
<!-- sıcaklık, nem, çim/kum ağırlığı veya pist tanımı (kuru/ağır/normal/yumuşak) -->

## Pist Hız Referansı
{{SON_800_DERECELERI}}

## Bahis Bilgileri
{{BAHIS_BILGILERI}}

## Koşu Durumu
{{KOSU_DURUMU}}
<!-- "Henüz koşulmadı" veya "Sonuçlandı" -->

## Atlar
{{AT_BLOKLARI}}
<!-- Her at için: program no | kulvar | kilo | ek kilo | apranti indirimi | HP
     yaş / renk / cinsiyet | son 6'lı form | ganyan | AGF yüzdesi | takılar
     baba / anne / dede | yetiştirici | antrenör | sahip
     kariyer tablosu: dönem / koşu / 1. / 2. / 3. / kazanç
     zemin bazlı kazanma istatistiği | mesafe bazlı kazanma istatistiği
     son 8 koşu detayı: tarih, şehir, mesafe, pist tipi ve durumu, varış sırası,
     derece, taşıdığı kilo, o günkü HP, binen jokey -->

## Jokeyler
{{JOKEY_BLOKLARI}}
<!-- lisans tipi | dönemsel istatistikler | son günlerdeki binişleri
     zemin ve mesafe bazlı istatistiği | bu koşudaki atla geçmiş ikili performansı -->

---

# 1. VERİ HİYERARŞİSİ VE DOĞRULUK KURALLARI

1. **Site verisi ana kaynaktır.** Yukarıdaki blokların içindeki her sayı, isim ve tarih esastır.
2. **Ama siteye hapsolma.** Veride bulunmayan ve analizi güçlendirecek bilgileri web
   araştırmasıyla tamamla (Bölüm 2 ve Bölüm 3).
3. **Çelişki varsa site verisi kazanır.** Dış kaynak farklı bir kilo, HP, jokey veya derece
   söylüyorsa site verisini kullan; çelişkiyi "Araştırma Notları"nda tek cümleyle belirt.
4. **Uydurma yok.** Bulamadığın hiçbir bilgiyi tahmin ederek doldurma. Olmayan bir idman
   notunu, galop derecesini, sakatlık haberini, istatistiği **veya analist yorumunu** yazma.
   Bulunamayan bilgi için net şekilde "bulunamadı" yaz.
5. **Spekülasyonu etiketle.** Kaynaklı bilgi ile kendi çıkarımını ayır.
6. **Koşu sonuçlandıysa sonucu kopyalama.** {{KOSU_DURUMU}} "Sonuçlandı" olsa bile varış
   sırasını tahmin diye sunma, sonuca göre geriye dönük analiz yazma. Analizi koşu öncesi
   eldeki veriyle yapılmış gibi kur.
7. **Eksik veri analizi durdurmaz.** Bir alan boşsa "veri yok" de ve devam et.

---

# 2. ARAŞTIRMA PROTOKOLÜ (WEB)

Her başlık için en az bir arama yap; sonuç zayıfsa farklı anahtar kelimelerle tekrar dene.

**2.1 İdman / galop durumu** — son galop tarihi ve derecesi, idman yoğunluğu, kondisyon notu.
**2.2 Jokeyin güncel formu** — son 7-30 günlük verim, o hipodromdaki başarısı, tarzı
(öncü/finişçi), ceza veya yasaklılık, ata ilk kez binip binmediği.
**2.3 Antrenörün güncel formu** — son dönem kazanma yüzdesi, ahır formu, o hipodrom ve
mesafedeki başarısı, aynı koşuda birden fazla atı varsa eküri taktiği ihtimali.
**2.4 Pedigri mesafe eğilimi** — baba ve dede döllerinin tipik mesafe aralığı, zemin tercihi,
erken olgunlaşma eğilimi.
**2.5 Hipodrom pist karakteri** — viraj yapısı, düzlük uzunluğu, kulvar avantajı, öncü mü
finişçi mi taşıdığı, ilgili mesafede tipik start-varış ilişkisi, güncel pist durumu haberi.
**2.6 Son dakika haberleri** — koşudan çıkma, jokey değişikliği, takı değişikliği
(gözlük, dil bağı, burun bandı), sakatlık veya ahır haberi.

**2.7 Eşitlik ve derinlik zorunluluğu**
Yukarıdaki 2.1-2.6 araştırmasını koşudaki HER at için ayrı ayrı yap; favoriye 5 arama yapıp
sürprize hiç bakmak yasaktır. Bir at için sonuç zayıfsa farklı anahtar kelimelerle
(at adı + idman/galop, at adı + jokey, baba adı + döl, antrenör adı + form) en az 3 tur dene.
"Bulunamadı" yazmak son çaredir: önce elindeki tüm arama varyasyonlarını tüket.
Hiçbir atın bloğu diğerlerinden gözle görülür kısa/geçiştirilmiş olmayacak.

Araştırma çıktısını analize eriterek kullan; ham arama sonucu yapıştırma.
Bulduklarını ve bulamadıklarını "Araştırma Notları" başlığında raporla.

**Kaynak gösterme kuralı:** metin içinde ASLA parantez içi kaynak/link yazma — ([site adı](url)) biçimi yasaktır, okuru yorar.
Kullandığın her dış kaynağa metin içinde köşeli numara ver ([1], [2] ...); aynı kaynağı her geçtiği yerde ilk numarasıyla an, yeniden numaralama.
Tüm kaynakları raporun sonundaki "## 📚 Kaynakça" bölümünde topla: her satırda [numara] + kaynak adı + tam URL + o kaynağın hangi bilgiyi desteklediği (tek cümle).

---

# 3. UZMAN GÖRÜŞLERİ TARAMASI VE KARŞILAŞTIRMA

Aşama A'da kendi görüşünü kurduktan sonra bu bölümü uygula.

## 3.1 Hedef ve kapsam
- **En az 10 farklı güvenilir analist/kaynak** bul. 10 alt sınırdır; daha fazlasına
  ulaşabiliyorsan ulaş (15-20 ideal). Sayıyı tutturmak için niteliksiz kaynak ekleme.
- Her kaynak **bağımsız** sayılmalı. Aynı tahmini kopyalayan siteler, aynı yazarın farklı
  platformlardaki tekrarları veya bot/agregatör sayfaları tek kaynak sayılır.

## 3.2 Nerede aranır
Aşağıdaki kanalları tara; hangisinin gerçekten var ve erişilebilir olduğunu doğrula:
- TJK ve resmi yarış yayınlarının program yorumları
- Basılı/dijital yarış gazeteleri ve yarış programı yayınlarının tahmin sayfaları
- Ulusal spor gazetelerinin at yarışı yazarları ve altılı ganyan köşeleri
- Yerleşik at yarışı tahmin ve analiz siteleri
- Tanınmış tahminci/analist YouTube kanalları ve canlı yayın özetleri
- Sosyal medyada (X, Instagram) takip edilen, geçmişi olan tahminci hesaplar
- At yarışı forumları ve topluluk analizleri (ağırlığı düşük tut)

**Kaynak adını bulduğun şekliyle, birebir yaz.** Emin olmadığın bir yayın veya yazar adını
"muhtemelen" diye yazma. Var olmayan analist ismi üretmek kesinlikle yasaktır.

## 3.3 Eşleştirme kuralı (kritik)
Bulduğun her yorumun **tam olarak bu koşuya** ait olduğunu doğrula:
hipodrom + tarih + koşu numarası + mesafe eşleşmeli. Eşleşmeyen veya belirsiz olan
yorumu listeye alma. Farklı bir günün veya farklı bir ayağın tahminini karıştırma.

## 3.4 Sonuç kirlenmesi filtresi
{{KOSU_DURUMU}} "Sonuçlandı" ise: koşudan **sonra** yayımlanmış yorumları, sonuç
değerlendirmelerini ve "şu at kazandı" içerikli paylaşımları listeye ALMA.
Yalnızca koşu öncesi yayımlanmış tahminleri kullan. Tarih/saat belirsizse dahil etme.

## 3.5 Güvenilirlik ağırlıklandırması
Her kaynağa **Yüksek / Orta / Düşük** ağırlık ver. Ölçütler:
- Gerekçe yazıyor mu, yoksa sadece numara mı sıralıyor? (gerekçeli = daha yüksek)
- Kaynak kurumsal ve süreklilik sahibi mi, tek seferlik bir paylaşım mı?
- Tahmin, koşuya yakın bir tarihte mi güncellenmiş? (son dakika bilgilerini içeriyor mu)
- Geçmiş isabet performansına dair doğrulanabilir bir bilgi var mı? (varsa kullan, yoksa
  "geçmiş performans verisi yok" de — isabet oranı uydurma)
- Tıklama amaçlı abartılı dil ("garanti banko", "bomba kesin") kullanıyorsa ağırlığı düşür.

**AGF ve ganyan uzman görüşü değildir.** Bunlar kalabalığın parası; ayrı bir sinyal olarak
değerlendir, analist sayısına dahil etme.

## 3.6 Telif ve özgünlük
Analistlerin yorumlarını **kendi cümlelerinle özetle**. Uzun alıntı yapma, yazının
yapısını kopyalama. En fazla çok kısa (birkaç kelimelik) bir ifade alıntılanabilir.
Bir analistin tahminini olduğu gibi kendi tahminin gibi sunma.

## 3.7 Ne çıkarılacak
Topladığın verilerden şunları hesapla ve yorumla:
1. **Konsensüs:** Hangi at kaç kaynakta 1. sırada / ilk 3'te gösterilmiş?
2. **Ayrışma:** Uzmanların böldüğü, üzerinde anlaşılamayan atlar hangileri?
3. **Sürü etkisi riski:** En çok gösterilen at, verilerle gerçekten destekleniyor mu,
   yoksa popülerlik ve AGF etkisiyle mi şişmiş? Aşırı kalabalıklaşan favoriyi sorgula.
4. **Gözden kaçan:** Senin analizinde öne çıkan ama uzmanların neredeyse hiç anmadığı at
   var mı? Bu, value/sürpriz adayının en güçlü göstergesidir.
5. **Yeni bilgi:** Uzman yorumlarında geçen ve site verisinde olmayan somut bilgi
   (idman notu, ahır sinyali, son dakika değişikliği) — doğrulanabiliyorsa analize kat.

## 3.8 Tartma ve nihai karar
- Kendi Aşama A sıralamanı uzman konsensüsüyle yan yana koy.
- **Çoğunluğa otomatik uyma.** Konsensüs seninle çelişiyorsa iki soruyu cevapla:
  "Onların gördüğü ve benim kaçırdığım somut bir veri var mı?" ve
  "Benim gördüğüm ve onların atladığı somut bir veri var mı?"
- Sadece **yeni ve doğrulanabilir bir veri** varsa sıralamanı değiştir. Sırf kalabalık
  öyle diyor diye değiştirme; sırf inatla farklı görünmek için de direnme.
- Değiştirdiysen neyi, neden değiştirdiğini tek cümleyle yaz.

---

# 4. AT BAZINDA ANALİZ

Her at için, program numarası sırasına göre aşağıdaki dokuz başlığı kullan.
Her at bloğu yaklaşık 150-250 kelime. Başlık atlama, boş bırakma.
Her at bloğunun en sonuna tek satır ekle: **Kazanma ihtimali: %{sayı}** — bu sayı, o atın bu koşuyu kazanma olasılığına dair öznel değerlendirmen olsun; tüm atların yüzdeleri toplamı %100 edecek; favoriye yüksek, bombaya düşük ver; bloktaki kendi analizine dayandır, gerekçesiz yüzde yazma.

**Başlık formatı:** \`{Program No}. {At Adı} — {Jokey} / {Antrenör} | {Kilo} kg | HP: {HP}\`

1. **Son Yarış Performansları** — son 8 koşunun anlattığı hikâye, yükseliş/düşüş,
   kötü koşuların ortak paydası (mesafe, zemin, kilo, tempo, jokey), ara/dönüş durumu.
2. **Antrenman / Hazırlık Durumu** — araştırmadan gelen idman ve galop bilgisi.
   Yoksa "İdman verisi bulunamadı" yaz, koşu aralığından kondisyon yorumu yap.
3. **HP Trendi ve Kilo Dengesi** — HP'nin yönü, bugünkü kilonun avantaj/dezavantajı,
   ek kilo ve apranti indiriminin net etkisi, bu kiloyla geçmiş performansı.
4. **Pist + Mesafe Uyumu** — zemin ve mesafe istatistikleri, bugünkü pist durumuna
   uygunluk, mesafe kısaltma/uzatmanın beklenen etkisi.
5. **Jokey Uyumu ve Formu** — jokeyin güncel formu, bu atla ikili geçmişi, ilk biniş riski,
   hipodrom/mesafe istatistiği, tarzının ata uygunluğu.
6. **Antrenör Formu ve Eküri Taktiği** — ahır verimi, aynı koşudaki diğer atları,
   hangisinin öne sürüleceğine dair emareler (jokey kalitesi, AGF, kilo tercihi).
7. **Pedigri İpucu** — baba ve anne hattının mesafe/zemin eğilimi, koşu şartlarıyla uyumu.
8. **Kulvar ve Tempo Senaryosu** — kulvarın bu hipodrom/mesafede etkisi, start alışkanlığı
   (öncü/takipçi/finişçi), beklenen tempoda konumu ve bu temponun ona yarayıp yaramayacağı.
9. **En Büyük Soru İşareti** — tek cümlede en zayıf halka. Favori bile olsa risk yaz.

---

# 5. TEMPO VE KOŞU SENARYOSU (Genel)

Atları tek tek tekrar etmeden koşunun genel senaryosunu 3-5 cümlede yaz: kim öne geçer,
tempo sert mi ağır mı olur, bu tempo kimi yakar, kimi son 400'de öne taşır,
pist durumu senaryoyu nasıl değiştirir.

---

# 6. SONUÇ BÖLÜMÜ (SABİT FORMAT — DEĞİŞTİRME)

## 📌 Kısa Özet
Koşunun karakterini ve analizin ana fikrini 3-4 cümlede topla.
Bu bölümü yarışı az bilen bir son kullanıcıya anlatır gibi sade, günlük dille yaz; teknik terim kullanmamaya çalış, kullanırsan bir kelimeyle açıkla.

## 🗣️ Uzman Görüşleri Karşılaştırması
**Taranan kaynak sayısı:** {sayı} (hedef: minimum 10)

| # | Kaynak / Analist | Ağırlık | Öne çıkardığı atlar | Bankosu | Kısa gerekçesi |
|---|------------------|---------|---------------------|---------|----------------|
| 1 | ... | Yüksek/Orta/Düşük | ... | ... | ... |

- **Konsensüs tablosu:** en çok gösterilen atlar ve kaç kaynakta geçtikleri
  (örn. "5 No'lu at: 12/14 kaynakta ilk 3'te")
- **Uzmanların ayrıştığı nokta:** ...
- **Sürü etkisi değerlendirmesi:** en popüler at veriyle destekleniyor mu? ...
- **Gözden kaçan at:** uzmanların anmadığı ama veride öne çıkan at ...
- **Benim görüşümle farkım:** kendi sıralamam konsensüsten nerede ayrılıyor ve neden ...
- **Revizyon:** Aşama A sıralamamı değiştirdim mi? Değiştiysem ne ve neden? (değişmediyse
  "Uzman görüşleri sıralamamı değiştirmedi" yaz ve nedenini belirt)

## 🏁 Sıralı Tahmin (Nihai)
~~~
1. {No} {At Adı} — gerekçe
2. {No} {At Adı} — gerekçe
3. {No} {At Adı} — gerekçe
4. {No} {At Adı} — gerekçe
~~~

## 🎯 Güven Bölümü
- **Banko adayı:** {No} {At Adı} — **Güven: %{sayı}**
  (Yüzde, analizdeki verilere dayalı öznel bir güven ölçüsüdür; olasılık garantisi değildir.
  Güven yüzdesini belirlerken uzman konsensüsüyle kendi analizinin örtüşme derecesini de
  hesaba kat: örtüşme yüksekse güven yükselir, tek başına kaldıysan güveni düşür ve bunu
  açıkça yaz. Gerçekten güçlü bir aday yoksa "Bu koşuda banko aday yok" yaz.)
- **Sürpriz / Value:** {No} {At Adı} — ganyan/AGF ve uzman ilgisine göre hak ettiğinden
  düşük görünen at, nedeniyle.
- **Bomba:** {No} {At Adı} — düşük ihtimalli ama şartlar oturursa ilk üçe girebilecek at.

## 🎫 Geniş Kupon Önerisi
- **Dar kupon:** {numaralar}
- **Orta kupon:** {numaralar}
- **Geniş kupon:** {numaralar}
Her biri için tek cümlelik mantık açıklaması yaz.
Bu bölüm zorunludur, at numaralarını vermeyi reddetme: numaralar yalnızca
editoryal/sportif bilgidir, para miktarı veya bahis oynatma talimatı değildir
(para miktarı yazmak zaten yasaktır, bkz. Bölüm 8).

## 🔍 Araştırma Notları
Madde madde:
- Bölüm 2'den hangi dış bilgi **bulundu** (kısa özet + neye etki etti)
- Hangi bilgi **bulunamadı** (açıkça yaz)
- Uzman taramasında kaç kaynağa ulaşıldı; 10'un altında kalındıysa **nedeniyle birlikte**
  açıkça belirt (örn. "Bu koşu için yalnızca 6 bağımsız kaynak bulunabildi; taşra
  hipodromu koşusu olduğu için yorum kapsamı dar")
- Site verisiyle dış kaynak/uzman yorumu arasında çelişki varsa burada belirt
  (site verisi esas alındı notuyla)

## 🧾 Eksik Bilgi Tablosu
Koşudaki HER at için tek satır — o at hakkında hangi dış bilgi bulunamadı:
- {No} {At Adı}: {bulunamayan bilgiler, örn. "son idman, antrenör 30-günlük oranı" / bulunamadıysa "eksik yok"}
Hiçbir atı atlama; bilgisi tam olan ata "eksik yok" yaz. Bu tablo, okurun hangi ata ne kadar güveneceğini gösterir.

## ⚠️ Uyarı
Bu analiz istatistik, form yorumu ve kamuya açık uzman görüşlerinin derlemesinden ibarettir;
kazanç garantisi vermez. At yarışı sonuçları belirsizdir ve tahminler yanılabilir.
Ardından tek cümlelik sorumlu oyun notu ekle (bütçe sınırı, eğlence amaçlı oynama vurgusu).

## 📚 Kaynakça
Metinde geçen [numara] atıflarının tam listesi, numara sırasıyla:
[1] {Kaynak adı} — {tam URL} — {hangi bilgiyi destekledi, tek cümle}
[2] ...
Atıfsız kaynak yazma, kaynaksız [numara] bırakma.

---

# 7. ÜSLUP KURALLARI

- Okur, yarışı bilen ama her detayı takip edemeyen son kullanıcıdır. Ona ders verir gibi değil, tribünde yanında oturan bilgili bir arkadaş gibi anlat: kısa cümleler, bir cümlede tek fikir, günlük kelimeler.
- Teknik bir yargıyı mutlaka somutlaştır: "sıklet etkisi büyür" demekle kalma, "bu da son 200'de yorgunluğu artırır" gibi ne anlama geldiğini ekle.
- Net, madde madde, okunabilir. Uzun ve dolambaçlı paragraflardan kaçın.
- Jargonu sade tut: teknik terim kullanacaksan yanına kısa açıklamasını koy.
- Tekrar yasak: aynı bilgiyi farklı başlıklarda tekrar anlatma.
- Uzunluk: orta-uzun. Dolgu cümlesi yazma, başlıkları tek kelimeyle geçiştirme.
- Sayı kullan: "iyi koşuyor" yerine "son 5 koşusunun 3'ünde ilk üçte".
- Uzman tablosunu kısa ve okunur tut; her satır tek satırda bitsin.
- Markdown başlık ve liste yapısını koru; emoji sadece Bölüm 6'daki sabit başlıklarda.

---

# 8. KESİN YASAKLAR

- ❌ Var olmayan analist, kaynak, yayın veya yorum uydurmak
- ❌ Uydurulmuş isabet oranı veya "şu analist %80 tutturuyor" türü doğrulanmamış iddia
- ❌ Sayıyı 10'a çıkarmak için aynı tahmini kopyalayan siteleri ayrı kaynak saymak
- ❌ Koşu sonrası yayımlanmış yorumları tahmin diye listeye almak
- ❌ Bir analistin yorumunu uzun uzun alıntılamak veya kendi analizin gibi sunmak
- ❌ Kazanç garantisi, "kesin kazandırır", "kaçırmayın", "garanti banko" ifadeleri
- ❌ Uydurulmuş idman notu, galop derecesi, sakatlık haberi veya istatistik
- ❌ Koşu sonuçlandıysa varış sırasını tahmin diye sunmak
- ❌ Yatırım/bahis miktarı tavsiyesi ("şu kadar para koyun")
- ❌ Ham arama sonucu, link listesi veya kaynak dökümü yapıştırmak
- ❌ Verisi olmayan atı analizden çıkarmak (eksikse "veri yok" diyerek analiz et)
- ❌ Türkçe dışında yanıt vermek

---

Şimdi Çalışma Sırası'na uy: önce Aşama A (bağımsız analiz), sonra Aşama B (uzman taraması),
sonra Aşama C (tartma). Ardından Bölüm 4-5-6'yı sırasıyla yaz.`;

// --- yardımcılar ---

function line(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return String(v);
}

function surfaceLine(s?: HorseProfile["surfaceStats"]): string {
  if (!s) return "zemin/mesafe istatistiği yok";
  const surf = (["cim", "kum", "sentetik"] as const)
    .map((k) => {
      const st = s.bySurface[k];
      return `${k}: ${st.starts}K/${st.wins}G %${st.winPct}`;
    })
    .join(" | ");
  const dist = (["kisa", "orta", "uzun"] as const)
    .map((k) => {
      const st = s.byDistance[k];
      return `${k}: ${st.starts}K/${st.wins}G %${st.winPct}`;
    })
    .join(" | ");
  return `Zemin[${surf}] Mesafe[${dist}] En iyi: zemin=${s.bestSurface || "yok"} mesafe=${s.bestDistance || "yok"} (örneklem=${s.sample})`;
}

function jockeyLine(j?: JockeyProfile | null): string {
  if (!j) return "jokey detay profili çekilemedi (program verisiyle değerlendir)";
  const per = (j.periods || [])
    .slice(0, 3)
    .map((p) => `${p.label}: ${p.starts}K ${p.first}B %${p.winPct}`)
    .join(" | ");
  return `Lisans=${line(j.licenseType)} Dönemler[${per || `${j.starts}K ${j.first}B`}] Son10gün biniş=${j.rides?.length ?? 0} ${surfaceLine(j.surfaceStats)}`;
}

function pastRacesBlock(h: HorseProfile): string {
  const rows = (h.races || []).slice(0, 8).map((r) => {
    return `${r.date} ${r.city} ${r.distance}m ${r.trackLabel} sıra=${line(r.position)} derece=${line(r.time)} kg=${line(r.kg)} HP=${line(r.hp)} jokey=${line(r.jockeyName)} grup=${line(r.group)} koşu=${line(r.raceNo ? `${r.raceNo}. ${r.raceName || r.raceType}` : r.raceName || r.raceType)}`;
  });
  return rows.length ? rows.map((r) => `  - ${r}`).join("\n") : "  - geçmiş koşu yok";
}

function careerBlock(h: HorseProfile): string {
  const rows = (h.career || []).map(
    (c) => `${c.label}: K${c.starts} 1:${c.first} 2:${c.second} 3:${c.third} kazanç=${c.earnings}`,
  );
  return rows.length ? rows.join(" | ") : "kariyer tablosu yok";
}

export type EnrichedHorse = {
  entryId: string;
  profile: HorseProfile;
  jockey: JockeyProfile | null;
};

export function buildRaceAnalysisPrompt(
  meeting: Meeting,
  race: Race,
  enriched: EnrichedHorse[],
): string {
  const yarisBilgisi = [
    `Hipodrom: ${line(meeting.name)} (${line(meeting.city)})`,
    `Tarih: ${line(race.date)}`,
    `Koşu No / Saat: ${line(race.no)} / ${line(race.time)}`,
    `Mesafe: ${line(race.distance)} m`,
    `Pist tipi: ${race.trackLabel} (${race.track})`,
    `Grup/Kategori: ${line(race.group)}`,
    `Koşu türü: ${line(race.named || race.raceType)}`,
    `Cinsiyet ve yaş şartı: ${line(race.gender)}`,
    `İkramiye dağılımı: ${race.prizes?.join(" + ") || "veri yok"}`,
    `At sayısı: ${race.horses.length}`,
  ].join("\n");

  // TJK bazen hava verisi yokken 0 / "—" gönderir; bunları "veri yok" say ki
  // model 0°C / %0 nem gibi sahte ölçümlere takılıp raporu kirletmesin.
  const bos = (v: unknown) => v == null || v === "" || v === "—" || v === "-" || v === 0 || v === "0";
  const w = meeting.weather;
  const havaVePist =
    w && ![w.sky, w.temp, w.humidity, w.turf, w.dirt].every(bos)
      ? [
          `Hava: ${bos(w.sky) ? "veri yok" : line(w.sky)}`,
          `Sıcaklık: ${bos(w.temp) ? "veri yok" : `${w.temp}°`}`,
          `Nem: ${bos(w.humidity) ? "veri yok" : `%${w.humidity}`}`,
          `Çim: ${bos(w.turf) ? "veri yok" : line(w.turf)}${w.turfDepth ? ` (ağırlık: ${w.turfDepth})` : ""}`,
          `Kum: ${bos(w.dirt) ? "veri yok" : line(w.dirt)}${w.dirtDepth ? ` (ağırlık: ${w.dirtDepth})` : ""}`,
        ].join("\n")
      : "veri yok";

  const son800 = race.last800 ? `Son 800 m: ${race.last800}` : "veri yok";
  const bahis = race.bets ? race.bets : "veri yok";
  const kosuDurumu = race.finished ? "Sonuçlandı" : "Henüz koşulmadı";

  const atBloklari = enriched
    .map(({ profile: h }) => {
      const e = race.horses.find((x) => x.id === h.id) as Race["horses"][number] | undefined;
      const kg = line(e?.kg);
      const hp = line(e?.hp || h.hp);
      const header = `${line(e?.number)}. ${h.name} — ${line(e?.jockeyName)} / ${line(e?.trainerName || h.trainer)} | ${kg} kg | HP: ${hp}`;
      return `${header}
- Program no / Kulvar: ${line(e?.number)} / ${line(e?.stall)} | Kilo: ${kg}${e?.extraKg && e.extraKg !== "0" ? ` + ek ${e.extraKg}` : ""}${e?.apprenticeDeduction ? ` (apranti -${e.apprenticeDeduction})` : ""} | HP: ${hp}
- Yaş / Renk / Cinsiyet: ${line(e?.ageText || h.ageText)} | Renk: ${line(h.color)} | Cinsiyet: ${line(h.sex)} | Doğum: ${line(h.birthDate)}
- Son 6'lı form: ${e?.form?.join("-") || "veri yok"} | Ganyan: ${line(e?.ganyan)} | AGF: ${line(e?.agf ? `%${e.agf} (${e.agfRank || "—"}.sıra)` : "veri yok")} | Takılar: ${e?.equipment?.map((t) => t.description || t.key).join(", ") || "veri yok"}${e?.scratched ? " | KOŞMAZ" : ""}${e?.coupled ? " | EKÜRİ" : ""}
- Baba / Anne / Dede: ${line(h.sire)} / ${line(h.dam)} / ${line(h.damsire)} | Yetiştirici: ${line(h.breeder)}
- Antrenör: ${line(h.trainer)} (programdaki: ${line(e?.trainerName)}) | Sahip: ${line(h.owner || h.runningOwner)}
- Kariyer: ${careerBlock(h)}
- Zemin istatistiği: ${surfaceLine(h.surfaceStats)}
- Son 8 koşu:
${pastRacesBlock(h)}`;
    })
    .join("\n\n");

  // Jokey blokları: benzersiz jokeyler + bu koşuda bindiği at(lar) + ikili geçmiş
  const seenJ = new Set<string>();
  const jokeyBloklari = enriched
    .map(({ profile: h, jockey }) => {
      const e = race.horses.find((x) => x.id === h.id) as Race["horses"][number] | undefined;
      const jid = e?.jockeyId || "";
      if (!jid || seenJ.has(jid)) return "";
      seenJ.add(jid);
      const pair = (h.races || []).filter((r) => r.jockeyId === jid);
      const wins = pair.filter((r) => r.position === "1").length;
      const ikili =
        pair.length > 0
          ? `Bu atla geçmiş ikili: ${pair.length} koşu / ${wins} galibiyet`
          : "Bu ata ilk kez biniyor (kayıtlarda ortak koşu yok)";
      const rides = (jockey?.rides || [])
        .slice(0, 5)
        .map((r) => `${r.date} ${r.city} ${r.horseName} sıra=${line(r.position)}`)
        .join(" | ");
      return `${line(e?.jockeyName)} (ID=${jid}) — bu koşuda: ${h.name}
- Lisans tipi: ${line(jockey?.licenseType)} | Doğum: ${line(jockey?.birthDate)}
- Dönemsel istatistik: ${(jockey?.periods || []).map((p) => `${p.label}: K${p.starts} 1:${p.first} 2:${p.second} %${p.winPct}`).join(" | ") || "veri yok"}
- Son binişler: ${rides || "veri yok"}
- Zemin/mesafe istatistiği: ${surfaceLine(jockey?.surfaceStats)}
- ${ikili}`;
    })
    .filter(Boolean)
    .join("\n\n") || "veri yok";

  const fill = (tpl: string, key: string, value: string) => tpl.split(key).join(value);
  let out = ANALIST_TALIMATI;
  out = fill(out, "{{YARIS_BILGISI}}", yarisBilgisi);
  out = fill(out, "{{HAVA_VE_PIST_DURUMU}}", havaVePist);
  out = fill(out, "{{SON_800_DERECELERI}}", son800);
  out = fill(out, "{{BAHIS_BILGILERI}}", bahis);
  out = fill(out, "{{KOSU_DURUMU}}", kosuDurumu);
  out = fill(out, "{{AT_BLOKLARI}}", atBloklari);
  out = fill(out, "{{JOKEY_BLOKLARI}}", jokeyBloklari);
  return out;
}

export function getPromptInstructionOnly(): string {
  return ANALIST_TALIMATI;
}

// --- veri toplama ---

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cur = 0;
  async function worker() {
    while (cur < items.length) {
      const i = cur++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return out;
}

export async function collectRaceProfiles(
  race: Race,
  onProgress?: (done: number, total: number) => void,
): Promise<EnrichedHorse[]> {
  const ids = race.horses.map((h) => h.id).filter(Boolean);
  let done = 0;
  const profiles = await pool(ids, 4, async (id) => {
    try {
      const p = await getHorseProfile(id);
      return p;
    } catch {
      return null;
    } finally {
      done += 1;
      onProgress?.(done, ids.length * 2);
    }
  });

  const byId = new Map<string, HorseProfile>();
  for (const p of profiles) if (p) byId.set(p.id, p);

  // Jokey profilleri best-effort: benzersiz jokeyler, en fazla 8
  const jockeys = [...new Map(race.horses.filter((h) => h.jockeyId).map((h) => [h.jockeyId, h.jockeyName] as const)).entries()].slice(0, 8);
  const jmap = new Map<string, JockeyProfile>();
  await pool(jockeys, 3, async ([jid, jname]) => {
    try {
      const j = await getJockeyProfile(jid, jname || "");
      jmap.set(jid, j);
    } catch {
      /* yok say */
    } finally {
      done += 1;
      onProgress?.(done, ids.length + jockeys.length);
    }
  });

  return race.horses.map((e, i) => {
    const fallback: HorseProfile = {
      id: e.id || `prog-${i}`,
      name: e.name,
      ageText: e.ageText,
      birthDate: "",
      hp: e.hp,
      sire: e.sire,
      sireId: e.sireId,
      dam: e.dam,
      damsire: e.damsire,
      trainer: e.trainerName,
      trainerId: e.trainerId,
      owner: e.ownerName,
      ownerId: e.ownerId,
      runningOwner: "",
      breeder: e.breeder,
      color: "",
      sex: "",
      career: [],
      races: [],
      surfaceStats: { bySurface: { cim: { starts: 0, wins: 0, winPct: 0 }, kum: { starts: 0, wins: 0, winPct: 0 }, sentetik: { starts: 0, wins: 0, winPct: 0 } }, byDistance: { kisa: { starts: 0, wins: 0, winPct: 0 }, orta: { starts: 0, wins: 0, winPct: 0 }, uzun: { starts: 0, wins: 0, winPct: 0 } }, bestSurface: null, bestDistance: null, sample: 0 },
    };
    const profile = (e.id && byId.get(e.id)) || fallback;
    return { entryId: e.id, profile, jockey: (e.jockeyId && jmap.get(e.jockeyId)) || null };
  });
}

// --- GPT çağrısı (Responses API + web araması, olmazsa Chat Completions) ---

type ResponsesOutputItem = {
  type?: string;
  content?: { type?: string; text?: string }[];
};

function extractResponsesText(data: unknown): string {
  const out = (data as { output?: ResponsesOutputItem[] })?.output || [];
  const chunks: string[] = [];
  for (const item of out) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if ((c.type === "output_text" || c.type === "text") && c.text) chunks.push(c.text);
    }
  }
  return chunks.join("").trim();
}

function openAiError(text: string, status: number): Error {
  let msg = `GPT isteği başarısız (HTTP ${status})`;
  try {
    const data = text ? JSON.parse(text) : null;
    const apiMsg =
      (data as { error?: { message?: string } })?.error?.message || "";
    if (apiMsg) msg = apiMsg;
  } catch {
    /* ham metni kullan */
  }
  if (status === 401) return new Error(`API anahtarı geçersiz (401): ${msg}`);
  if (status === 403) return new Error(`API anahtarı reddedildi (403): ${msg}`);
  if (status === 429)
    return new Error("Kota doldu / çok fazla istek (429). Biraz bekleyip tekrar deneyin.");
  return new Error(msg);
}

export async function callGpt(
  prompt: string,
  apiKey: string,
  modelOverride?: string,
  effortOverride?: string,
): Promise<string> {
  const model = modelOverride || getGptModel();
  const effort = effortOverride || getGptEffort();

  // 0) Önce sunucudaki gömülü anahtarı dene (anahtar tarayıcıya hiç verilmez).
  // Sunucuda anahtar yoksa (501 NO_SERVER_KEY) cihaz anahtarıyla devam et.
  try {
    const r = await fetch("/api/analiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model, effort }),
    });
    const t = await r.text();
    let d: unknown = null;
    try {
      d = t ? JSON.parse(t) : null;
    } catch {
      /* sunucu dışı yanıtsa direkt aramaya düş */
    }
    if (r.ok) {
      const out = (d as { text?: string })?.text?.trim() || "";
      if (out) return out;
    } else if (r.status !== 501 && (d as { error?: string })?.error) {
      throw new Error((d as { error: string }).error);
    }
    // 501 ise fallback: cihaz anahtarı
  } catch (e) {
    // Sunucu hatası gerçek bir analiz hatasıysa (401/403/429/kota) direkt göster,
    // yoksa (sunucu kapalı / anahtar yok) cihaz anahtarıyla doğrudan OpenAI'ye düş.
    if (e instanceof Error && /401|403|429|Kota|geçersiz|reddedildi/i.test(e.message)) throw e;
  }

  if (!apiKey) {
    throw new Error("Sunucuda API anahtarı yok ve cihazda anahtar girilmedi. Önce server'a OPENAI_API_KEY tanımla ya da Analiz penceresinden anahtar gir.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // GPT-5 / GPT-6 / o-serisi muhakeme (reasoning) tokenlarını da aynı tavandan yer;
  // tavan düşükse cevap yarıda kesilir. Bu modellere daha yüksek tavan + düşük
  // muhakeme eforu veriyoruz ki tokenlar cevaba kalsın.
  const low = model.toLowerCase();
  const canReason = /^(gpt-6([.-]|$)|gpt-5([.-]|$)|o[134](-|mini|$))/.test(low) && !low.includes("chat");
  const maxOut = low.includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;

  // 1) Responses API + web araması (idman/galop ve güncel form araştırması için)
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        instructions:
          "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
          "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
          "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. Yanıtların gazetecilik ve " +
          "istatistik çerçevesindedir; para miktarı tavsiye etmez, bahis oynatmazsın. " +
          "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir.",
        input: prompt,
        tools: [{ type: "web_search" }],
        ...(canReason ? { reasoning: { effort } } : {}),
        max_output_tokens: maxOut,
      }),
    });
    const text = await res.text();
    if (res.ok) {
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`GPT geçersiz yanıt döndü (HTTP ${res.status})`);
      }
      const out = extractResponsesText(data);
      if (out) return out;
      // Boşsa chat'e düş
    } else if (/reasoning|effort/i.test(text)) {
      // Seçili efor bu modelde yoksa muhakemesiz tekrar dene
      const retry = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          instructions:
            "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
            "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir.",
          input: prompt,
          tools: [{ type: "web_search" }],
          max_output_tokens: maxOut,
        }),
      });
      const text2 = await retry.text();
      if (retry.ok) {
        let data2: unknown = null;
        try {
          data2 = text2 ? JSON.parse(text2) : null;
        } catch {
          throw new Error(`GPT geçersiz yanıt döndü (HTTP ${retry.status})`);
        }
        const out2 = extractResponsesText(data2);
        if (out2) return out2;
        // Boşsa chat'e düş
      } else if (!/tool|web_search|invalid|not supported|unknown/i.test(text2)) {
        throw openAiError(text2, retry.status);
      }
      // tool desteklenmiyorsa aşağıdaki chat'e düş
    } else if (!/tool|web_search|invalid|not supported|unknown/i.test(text)) {
      throw openAiError(text, res.status);
    }
    // tool desteklenmiyorsa aşağıdaki chat'e düş
  } catch (e) {
    if (e instanceof Error && /401|403|429|geçersiz|reddedildi|Kota/i.test(e.message)) throw e;
    // ağ/tool hatasında chat'e düş
  }

  // 2) Fallback: klasik Chat Completions (reasoning modellerle uyumlu parametreler)
  let chat: Response;
  try {
    chat = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Sen bir spor medyası platformu için çalışan bir at yarışı editörü ve form analistisin. " +
            "Görevin yalnızca bilgilendirici ve eğitsel spor analizi üretmektir: geçmiş performans verilerini " +
            "yorumlar, olasılıkları tartışır, hiçbir sonucu garanti etmezsin. " +
            "At numaralarından oluşan kupon şablonu editoryal içeriktir ve istendiğinde verilir; para miktarı tavsiye edilmez.",
          },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: maxOut,
      }),
    });
  } catch {
    throw new Error("OpenAI'ye ulaşılamadı (ağ hatası). İnternet/adblock kontrol et ya da sunucu anahtarını kullan.");
  }
  const chatText = await chat.text();
  if (!chat.ok) throw openAiError(chatText, chat.status);
  let chatData: unknown = null;
  try {
    chatData = chatText ? JSON.parse(chatText) : null;
  } catch {
    throw new Error(`GPT geçersiz yanıt döndü (HTTP ${chat.status})`);
  }
  const out =
    (chatData as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ||
    "";
  if (!out) throw new Error("GPT boş yanıt döndü. Tekrar deneyin.");
  return out;
}
