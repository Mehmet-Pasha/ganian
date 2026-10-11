import { getHorseProfile, getJockeyProfile } from "./api";
import type { HorseProfile, JockeyProfile, Meeting, PedigreeStats, Race } from "./types";

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

// OpenRouter anahtarları "sk-or-" ile başlar; geri kalan her şey OpenAI sayılır.
export function isOpenRouterKey(key: string): boolean {
  return /^sk-or-/i.test((key || "").trim());
}

// Araştırma derinliği: analizden AYRI bir katman. Düşük = en ucuz.
export type ArastirmaDerinlik = "dusuk" | "orta" | "yuksek";
export const ARASTIRMA_DERINLIK_STORAGE = "mahmuz:arastirma";
export const ARASTIRMA_DERINLIKLERI = [
  { id: "dusuk", label: "Düşük — Tavily + nano özet (en ucuz)" },
  { id: "orta", label: "Orta — Perplexity Sonar (geniş tarama)" },
  { id: "yuksek", label: "Yüksek — Sonar + Tavily hibrit (en geniş kapsam)" },
] as const;

export function getArastirmaDerinlik(): ArastirmaDerinlik {
  try {
    const v = (localStorage.getItem(ARASTIRMA_DERINLIK_STORAGE) || "").trim();
    if (v === "dusuk" || v === "orta" || v === "yuksek") return v;
  } catch {
    /* yok say */
  }
  return "dusuk";
}

export function setArastirmaDerinlik(id: string) {
  try {
    localStorage.setItem(ARASTIRMA_DERINLIK_STORAGE, id);
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
- Analizi kısaltmak için bir başlığı atlama. Kısa kesmek yerine doğru ve eksiksiz yaz.
- Derinlik senin muhakeme kalitenle ilgilidir: veriyi sorgulayan, çelişkiyi yakalayan,
  tempo senaryosunu üç kez düşünen bir analist ol. Web'de arama yapman beklenmiyor —
  araştırma özetini KULLAN, onu tekrar üretmeye çalışma.

---

# ÇALIŞMA SIRASI (BU SIRAYI BOZMA)

**Aşama A — Bağımsız analiz:** Önce yalnızca site verisiyle (At/Jokey blokları +
hava/pist) kendi görüşünü oluştur. Kendi 1-2-3-4 sıralamanı ve banko adayını
zihninde belirle. Bu aşamada araştırma verisine ve başka analistlerin
tahminlerine BAKMA.

**Aşama B — Araştırma verisini işle:** Araştırma ekibi sana hazır bir özet
(kaynak tablosu + at bazlı son dakika + pist notu) verdi. Onu Bölüm 2'deki
kurallara göre işle; kendini yeniden doğrulamaya kaptırma.

**Aşama C — Tartma ve nihai karar:** Kendi görüşünle araştırma verisindeki uzman
görüşlerini karşılaştır, ayrıştığın noktaları gerekçelendir, gerekirse sıralamanı
revize et — ama sırf çoğunluk öyle diyor diye değiştirme. Nihai sıralama senin kararın.

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

## Araştırma Verisi (araştırma ekibinin çıktısı)
{{ARASTIRMA_VERISI}}
<!-- Araştırma ekibi web'i tarayıp hazırladı: kaynak tablosu (adı, URL, yayın
     tarihi, ağırlık, gösterdiği atlar), at bazlı son dakika bulguları, pist notu.
     WEB'E ÇIKMAZSIN; bu veriyle çalışırsın. Veri yoksa "araştırma verisi yok". -->

---

# 1. VERİ HİYERARŞİSİ VE DOĞRULUK KURALLARI

1. **Site verisi ana kaynaktır.** Yukarıdaki blokların içindeki her sayı, isim ve tarih esastır.
2. **Araştırma verisi ikincil katmandır.** Site verisinde bulunmayan (son dakika, uzman
   tercihi, pist haberi) bilgileri araştırma verisinden al; yeniden araştırma yapma.
3. **Çelişki varsa site verisi kazanır.** Araştırma verisi farklı bir kilo, HP, jokey veya
   derece söylüyorsa site verisini kullan; çelişkiyi "Araştırma Notları"nda tek cümleyle belirt.
4. **Uydurma yok.** Bulamadığın hiçbir bilgiyi tahmin ederek doldurma. Olmayan bir idman
   notunu, galop derecesini, sakatlık haberini, istatistiği **veya analist yorumunu** yazma.
   Bulunamayan bilgi için net şekilde "bulunamadı" yaz.
5. **Spekülasyonu etiketle.** Kaynaklı bilgi ile kendi çıkarımını ayır.
6. **Koşu sonuçlandıysa sonucu kopyalama.** {{KOSU_DURUMU}} "Sonuçlandı" olsa bile varış
   sırasını tahmin diye sunma, sonuca göre geriye dönük analiz yazma. Analizi koşu öncesi
   eldeki veriyle yapılmış gibi kur.
7. **Eksik veri analizi durdurmaz.** Bir alan boşsa "veri yok" de ve devam et.

---

# 2. ARAŞTIRMA VERİSİNİ KULLAN VE UZMAN GÖRÜŞLERİYLE KARŞILAŞTIR

**Önce şunu bil:** Aşağıdaki bilgiler AT BLOKLARINDA zaten verilmiştir; bunlara
dışarıda arama YAPMAZSIN, onları KENDİ yorumunla değerlendirirsin:

- **İdman/galop:** At bloklarında "Son idmanlar (TJK verisi)" satırında.
  Kondisyon değerlendirmesini BU veriden sen yap: son çalışma tarihi (yakınlık),
  çalışma sıklığı, split dereceleri pist ortalamasına göre hızlı mı, durum kodu.
- **Jokey/antrenör güncel formu:** At ve Jokey bloklarında "yakın dönem formu
  (uygulama verisi)" satırında (30 günlük istatistik). Değerlendirmeyi bu
  istatistikten yap.
- **Pedigri eğilimi:** At bloklarında "Baba dölü eğilimi" satırında. Veriliyorsa
  oradan kullan; yoksa baba/anne adının bilinen genel karakterini kısaca yaz.

**Web'e erişimin yok.** Son dakika haberleri, uzman tahminleri ve pist haberleri
ARAŞTIRMA VERİSİ bölümünde hazırlanmış olarak gelir. Onu yalnızca TÜKET:

## 2.1 Kaynak tablosunun işlenmesi
Araştırma verisindeki tablo her kaynak için şu alanları içerir: kaynak adı,
URL, **yayın tarihi/saati**, ağırlık (Yüksek/Orta/Düşük), öne çıkardığı atlar.
- Yayın tarihi **"belirsiz/tarihsiz"** işaretli kaynakları konsensüs hesabına alma;
  tabloda ayrı bir satırda "doğrulanamadı" olarak göster (asıl bilgisi değerliyse
  Araştırma Notları'nda an).
- Sonuçlanmış koşuda, koşudan SONRA yayımlanmış görünen yorumları da alma.
- Tablodaki ağırlıkları yeniden hesaplama; ağırlıklandırma işi araştırma ekibinin.

## 2.2 Konsensüs hesabı (mekanik)
Tablodan say: hangi at kaç kaynakta 1. sırada / ilk 3'te gösterilmiş.
- Kaynak sayısı 0-3 ise: "uzman verisi sınırlı" de; konsensüsü tek kaynakla
  genişleteyim diye abartma; bölümü kısa tut ve kendi Aşama A analizine ağırlık ver.
- **AGF ve ganyan uzman görüşü değildir** — ayrı bir sinyal olarak değerlendir,
  konsensüse katma.

## 2.3 Tartma ve nihai karar
- Kendi Aşama A sıralamanı konsensüsle yan yana koy.
- **Çoğunluğa otomatik uyma.** Konsensüs seninle çelişiyorsa iki soruyu cevapla:
  "Onların gördüğü ve benim kaçırdığım somut bir veri var mı?" ve
  "Benim gördüğüm ve onların atladığı somut bir veri var mı?"
- Sadece **yeni ve doğrulanabilir bir veri** varsa sıralamanı değiştir. Sırf kalabalık
  öyle diyor diye değiştirme; sırf inatla farklı görünmek için de direnme.
- Değiştirdiysen neyi, neden değiştirdiğini tek cümleyle yaz.
- **Gözden kaçan at:** Senin analizinde öne çıkan ama uzmanların neredeyse hiç
  anmadığı at — value/sürpriz adayının en güçlü göstergesidir.
- Araştırma verisinde geçen ve site verisinde olmayan somut bilgi (idman notu,
  ahır sinyali, son dakika) — analize kat; yalnızca tabloda kaynaklıysa.

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
**Araştırma verisindeki kaynak sayısı:** {sayı} (konsensüse sayılan / toplam)

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
- Araştırma verisinden hangi dış bilgi **kullanıldı** (kısa özet + neye etki etti)
- Araştırma verisinde hangi bilgi **bulunamadı** (o da özetle bildirilmişse aynen aktar;
  açıkça yaz)
- Konsensüse sayılan ve sayılmayan (tarihsiz/sonrası) kaynak sayısını ayrı belirt
- Site verisiyle araştırma verisi arasında çelişki varsa burada belirt
  (site verisi esas alındı notuyla)

## 🧾 Eksik Bilgi Tablosu
Koşudaki HER at için tek satır — o at hakkında **web'de aranmış ama bulunamamış** dış bilgi:
- {No} {At Adı}: {bulunamayan bilgiler, örn. "son dakika haberi" / bulunamadıysa "eksik yok"}
- AT BLOKLARINDA verilen bilgiler (idman/galop, yakın dönem jokey-antrenör formu,
  baba dölü eğilimi, kariyer, zemin istatistiği) bu tabloya YAZILMAZ — onlar
  araştırılmış değil, verilmiş bilgidir; değerlendirmen metinde yapılır.
- Yalnızca gerçekten web'de aranmış ve bulunamamış kalem yazılır. Uydurma yok.
Hiçbir atı atlama; eksiksiz ata "eksik yok" yaz. Bu tablo, okurun hangi ata ne kadar güveneceğini gösterir.

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

// TJK'nın IdmanIstatistikleri sayfasından çekilen galop kayıtları —
// web'de aranmaz, uygulama direkt çekiyor (kesin + ücretsiz).
function idmanBloku(h: HorseProfile): string {
  const rows = (h.idmanlar || []).slice(0, 3).map((r) => {
    const splits = [
      r.splits?.m1400 && `1400:${r.splits.m1400}`,
      r.splits?.m1200 && `1200:${r.splits.m1200}`,
      r.splits?.m1000 && `1000:${r.splits.m1000}`,
      r.splits?.m800 && `800:${r.splits.m800}`,
      r.splits?.m600 && `600:${r.splits.m600}`,
      r.splits?.m400 && `400:${r.splits.m400}`,
      r.splits?.m200 && `200:${r.splits.m200}`,
    ]
      .filter(Boolean)
      .join(" ");
    return [
      r.date,
      r.hipodrom,
      r.tip,
      r.track,
      r.pistDurum,
      splits,
      r.durum,
      r.jokey && `idman jokeyi: ${r.jokey}`,
    ]
      .filter(Boolean)
      .join(" | ");
  });
  return rows.length ? rows.join(" || ") : "idman kaydı yok";
}

// Baba döllerinin yakın dönem (30 gün) performansı — Bölüm 2.4'ün veri kaynağı.
// Analiz akışı /api/pedigree/toplu ile toplu çeker; profildeki optional pedigree
// alanı da desteklenir (ileride sunucu profilde dönerse otomatik çalışır).
type PedMap = Record<string, PedigreeStats | undefined>;

function pedigreeBloku(h: HorseProfile, ped: PedMap | undefined): string {
  const p = ped?.[h.id] || h.pedigree;
  if (!p || p.source !== "yakin-donem" || !p.sample) return "yakın dönem baba dölü verisi yok";
  const fmt = (s?: { starts: number; wins: number; winPct: number }) =>
    s && s.starts ? `${s.starts}K/${s.wins}G (%${s.winPct})` : "veri yok";
  return [
    `örnek: ${p.sample} koşu`,
    `mesafe — kısa: ${fmt(p.distance?.kisa)} | orta: ${fmt(p.distance?.orta)} | uzun: ${fmt(p.distance?.uzun)}`,
    `zemin — çim: ${fmt(p.surface?.cim)} | kum: ${fmt(p.surface?.kum)} | sentetik: ${fmt(p.surface?.sentetik)}`,
  ].join(" | ");
}

export type EnrichedHorse = {
  entryId: string;
  profile: HorseProfile;
  jockey: JockeyProfile | null;
};

// Uygulamanın KENDİ verisinden (liderlik API) gelen 30 günlük formlar —
// bunun için web'de aranmaz; zaten kesin, güncel ve ücretsizdir.
export type FormVerileri = {
  jockeys?: { id: string; name: string; starts: number; wins: number; winPct: number }[];
  trainers?: { id: string; name: string; starts: number; wins: number; winPct: number }[];
};

function trNorm(s: string): string {
  return (s || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

function formSatiri(rows: NonNullable<FormVerileri["jockeys"]>, ad: string): string {
  if (!rows?.length || !ad) return "veri yok";
  const n = trNorm(ad);
  const hit = rows.find((r) => trNorm(r.name) === n) || rows.find((r) => trNorm(r.name) && (n.includes(trNorm(r.name)) || trNorm(r.name).includes(n)));
  return hit ? `30 gün: ${hit.starts} koşu / ${hit.wins} galibiyet (%${hit.winPct})` : "veri yok";
}

export function buildRaceAnalysisPrompt(
  meeting: Meeting,
  race: Race,
  enriched: EnrichedHorse[],
  forms?: FormVerileri,
  pedigree?: Record<string, PedigreeStats | undefined>,
  arastirmaVerisi?: string,
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
- Antrenör yakın dönem formu (uygulama verisi): ${formSatiri(forms?.trainers || [], e?.trainerName || h.trainer)}
- Kariyer: ${careerBlock(h)}
- Son idmanlar (TJK verisi): ${idmanBloku(h)}
- Baba dölü eğilimi (yakın dönem verisi): ${pedigreeBloku(h, pedigree)}
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
- Jokey yakın dönem formu (uygulama verisi): ${formSatiri(forms?.jockeys || [], e?.jockeyName || jockey?.name || "")}
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
  out = fill(
    out,
    "{{ARASTIRMA_VERISI}}",
    arastirmaVerisi && arastirmaVerisi.trim()
      ? arastirmaVerisi.trim()
      : "araştırma verisi yok (araştırma katmanı çalışmadı; Bölüm 2 uygulanamaz, Aşama A analizine ağırlık ver)",
  );
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
  // Limit 3: 13 atlık patlamada TJK'ya nazik davran (4+'ta rate-limit artıyor).
  const profiles = await pool(ids, 3, async (id) => {
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

  // TJK profil sayfası bazen ismi boş döndürüyor ("At 115532" gibi görünür);
  // programdaki isimle düzelt.
  profiles.forEach((p, i) => {
    if (p && (!p.name || /^At \d+$/i.test(p.name))) {
      const e = race.horses.find((x) => x.id === ids[i]);
      if (e?.name) p.name = e.name;
    }
  });

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
      idmanlar: [],
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
      (data as { error?: { message?: string } })?.error?.message ||
      (typeof (data as { error?: unknown })?.error === "string" ? (data as { error: string }).error : "") ||
      (data as { message?: string })?.message ||
      "";
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

// --- web araştırması (sunucu tarafı, derinlik seçilebilir) ---

// Sorgular yarış bağlamından türetilir: koşu yorumları + AGF favorilerinin
// idman/galop'u + pist durumu. Koşu TARİHİ sorgularda açıkça geçer — aksi halde
// arama motorları haftalar önceki jenerik makaleleri döndürüyor (tespit edildi).
export function buildResearchQueries(meeting: Meeting, race: Race): string[] {
  const queries: string[] = [];
  const city = (meeting.city || "").trim();
  const trackLabel = (race.trackLabel || "").trim();
  const tarih = trTarihEtiket(race.date);
  const first = `${city} ${race.no}. koşu ${tarih} ${race.distance} m ${trackLabel} at yarışı tahmin yorum`
    .replace(/\s+/g, " ")
    .trim();
  if (city) queries.push(first);

  const favorites = [...race.horses]
    .filter((h) => !h.scratched && h.name)
    .sort((a, b) => (a.agfRank ?? 999) - (b.agfRank ?? 999))
    .slice(0, 2);
  for (const f of favorites) {
    queries.push(`${f.name} at idman galop ${tarih}`);
  }

  if (city && trackLabel) {
    queries.push(`${city} hipodrom pist durumu ${tarih}`);
  }
  return queries;
}

// race.date ISO (2026-10-11) ya da dd.mm.yyyy olabilir → "11 Ekim 2026" etiketi.
function trTarihEtiket(date: string): string {
  const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  let ymd = date || "";
  if (/^\d{2}[./]\d{2}[./]\d{4}$/.test(ymd)) {
    const [d, m, y] = ymd.split(/[./]/);
    ymd = `${y}-${m}-${d}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return "";
  return `${Number(m[3])} ${AYLAR[Number(m[2]) - 1] || ""} ${m[1]}`.replace(/\s+/g, " ").trim();
}

// --- araştırma ekibi promptları (Sunar çağrılarında kullanılır) ---

// İki prompt da aynı kaynak listesini kullanır — senkron kaymayı önlemek için
// tek sabit. Analist prompt'u bu listeyi İÇERMEZ (rol ayrımı).
const UZMAN_KAYNAK_LISTESI =
  "Şu kaynakları özellikle kontrol et (sıra önemini göstermez): " +
  "nesine.com at yarışı editör yorumları (koşu bazlı yazar yorumları), " +
  "liderform.com.tr (günlük analizler), yenibeygir.com (koşu sayfaları), " +
  "hipodrom.com uzman yorumları, istinyeganyan.com, pegadrom.com, atyarisi.ai, " +
  "yaristayiz.com, tayzeka.com, bayganyan.com, ganyancanavari.com.tr, ybulten.com.tr, " +
  "TJK program yorumları. Instagram/X hesapları yalnızca URL verilebiliyorsa Düşük ağırlıkla eklenir.";

function araştırmaAtListesi(race: Race): string {
  return race.horses
    .filter((h) => !h.scratched && h.name)
    .map(
      (h) =>
        `${h.number}. ${h.name} (jokey: ${h.jockeyName}, antrenör: ${h.trainerName}${h.hp ? `, HP: ${h.hp}` : ""}${h.agf ? `, AGF: %${h.agf}` : ""})`,
    )
    .join("\n");
}

function araştırmaKünye(meeting: Meeting, race: Race): string {
  return [
    `Koşu: ${meeting.city} ${meeting.name || ""} ${race.no}. koşu — ${race.date} ${race.time ? `(${race.time})` : ""}`,
    `Mesafe/Pist: ${race.distance} m ${race.trackLabel}`,
    `Şart: ${race.gender || race.group || race.raceType || ""}`,
    "",
    "Koşudaki atlar:",
    araştırmaAtListesi(race),
  ]
    .filter(Boolean)
    .join("\n");
}

// ORTA: tek çağrı — son dakika + uzman taraması + pist, yapılandırılmış şema ile.
export function buildResearchPromptOrta(meeting: Meeting, race: Race): string {
  return [
    "GÖREVİN: Türkiye at yarışı araştırmacısısın. Aşağıdaki koşu için web'i tarayıp ÜÇ bölüm döndürürsün. Analiz yazmazsın, tahmin yapmazsın; yalnızca kaynaklı veri derlersin.",
    "",
    araştırmaKünye(meeting, race),
    "",
    "BİLİNENLER (zaten elimizde — bunları ARAMA, tekrar raporlama): idman/galop kayıtları, jokey-antrenör 30 günlük istatistikler, baba dölü performansı, kariyer tabloları.",
    "",
    "## BÖLÜM A — SON DAKİKA BULGULARI (at bazlı)",
    "Her at için ayrı satır: `at adı — bulunan bilgi (kaynak adı [n])` veya `yok`.",
    "Aradıkların: koşudan çıkma, jokey değişikliği, takı değişikliği (gözlük, dil bağı, burun bandı), sakatlık, ahır haberi, son 3 gün içindeki herhangi bir özel haber.",
    "",
    "## BÖLÜM B — UZMAN TARAMASI",
    `${UZMAN_KAYNAK_LISTESI}`,
    "",
    "Her kaynak için tablo satırı: `[n] kaynak adı | URL | yayın tarihi (gg.aa.yyyy veya 'belirsiz') | ağırlık önerin (Yüksek/Orta/Düşük) | gösterdiği favori atlar (at adı veya program numarası) | tek cümle gerekçe`.",
    "Kurallar:",
    "- Yalnızca koşu günü veya en fazla 3 gün önce yayımlandığı görülen yorumları say; yayın tarihini HER satırda mutlaka yaz (yoksa 'belirsiz' yaz).",
    `- ${meeting.city} ${race.no}. koşuya (hipodrom+tarih) eşleşmeyen yorumları listeye alma.`,
    "- Aynı tahmini kopyalayan siteler tek kaynak sayılır; yorumsuz program listesi kaynak değildir.",
    "- Kaynak adını bulduğun şekliyle birebir yaz; var olmayan analist ismi üretmek yasaktır.",
    "- Hedef 10 bağımsız kaynak; az bulunursa o kadarıyla yetin, uydurma.",
    "",
    "## BÖLÜM C — PİST NOTU",
    `${meeting.city} hipodromunun pist karakteri (viraj/düzlük/kulvar etkisi) ve bugünkü pist durumu hakkında yayınlanmış bilgi. Kaynaklı; yoksa 'yok'.`,
    "",
    "## BÖLÜM D — BULUNAMAYANLAR",
    "Hangi atlar için ne aradığını ve bulamadığını tek satırlık liste olarak yaz (analistin eksik tablosu bundan oluşur).",
    "",
    "Çıktı dili Türkçe, kompakt markdown; ham arama metni yapıştırma; toplam ~1200 kelime.",
  ].join("\n");
}

// YÜKSEK: iki odaklı çağrı paralel çalışır — her biri derinleşir.
export function buildResearchPromptSonDakika(meeting: Meeting, race: Race): string {
  return [
    "GÖREVİN: Türkiye at yarışı araştırmacısısın. Aşağıdaki koşudaki HER at için son dakika bilgisini web'de tararsın. Analiz yazmazsın.",
    "",
    araştırmaKünye(meeting, race),
    "",
    "NE ARARSIN (yalnızca bunlar):",
    "- Koşudan çıkma (atın programdan düşmesi) veya yeni çıkış haberi",
    "- Jokey DEĞİŞİKLİĞİ: bugünkü bilinen jokeyin dışında yeni bir isim aktaran haber",
    "- Sakatlık/rahatsızlık, ahır/kamp haberi, özel son-3-gün notu",
    "NE ARAMA (bulgu SAYILMAZ, rapor etme):",
    "- Programda zaten görünen jokey/antrenör/sahip bilgisi ('X binmiş, Y hazırlıyor' teyidi bulgu değildir)",
    "- Programda zaten listelenen mevcut takı kodları (mevcut takı 'değişiklik' sayılmaz)",
    "- Kariyer/istatistik/AGF/ganyan verileri",
    "",
    "Yöntem: her at için en az 2 sorgu dene (at adı + idman/galop; at adı + jokey; antrenör adı + ahır). Favoriye fazla takılıp sürprizleri atmak yasak.",
    "Takı değişikliğini yalnızca bir kaynağın AÇIKÇA 'gözlük takıldı/çıkarıldı, dil bağı takıldı' dediğini görürsen raporla; kaynağı ve yayın tarihini yaz.",
    "",
    "Çıktı şeması:",
    "- Her at için: `at adı — bilgi özeti (kaynak adı, URL, yayın tarihi)` veya `yok`.",
    "- Bulgu verilen her satırda kaynak MUTLAKA olsun; kaynaksız satır yazma.",
    "- Sonra: `## BULUNAMAYANLAR` — hangi atlar için ne bulunamadı (tek satırlık liste).",
    "Uydurma yasak: bulamadığını 'yok' yaz. Çıktı Türkçe, kompakt.",
  ].join("\n");
}

export function buildResearchPromptUzman(meeting: Meeting, race: Race): string {
  const tarih = race.date;
  return [
    "GÖREVİN: Türkiye at yarışı araştırmacısısın. Aşağıdaki koşu için yayımlanmış uzman tahminlerini web'de toplarsın. Kendi tahminini yazmazsın.",
    "",
    araştırmaKünye(meeting, race),
    "",
    `${UZMAN_KAYNAK_LISTESI}`,
    "",
    "Her kaynak için tablo satırı: `[n] kaynak adı | URL | yayın tarihi (gg.aa.yyyy veya 'belirsiz') | ağırlık önerin (Yüksek/Orta/Düşük) | gösterdiği favori atlar (at adı veya program numarası) | tek cümle gerekçe`.",
    "Kurallar:",
    "- Yalnızca koşu günü veya en fazla 3 gün önce yayımlandığı görülen yorumları say; yayın tarihini HER satırda mutlaka yaz (yoksa 'belirsiz' yaz).",
    `- ${meeting.city} ${race.no}. koşuya (hipodrom + ${tarih}) eşleşmeyen yorumları listeye alma.`,
    "- Aynı tahmini kopyalayan siteler tek kaynak sayılır; yorumsuz program listesi kaynak değildir.",
    "- Kaynak adını bulduğun şekliyle birebir yaz; var olmayan analist ismi üretmek yasaktır.",
    "- Hedef 10 bağımsız kaynak; az bulunursa o kadarıyla yetin, uydurma.",
    "",
    "Çıktı: kaynak tablosu + sonda `## BULUNAMAYANLAR` (hangi kanallar boş döndü). Türkçe, kompakt.",
  ].join("\n");
}

// Özet, prompt şablonundaki {{ARASTIRMA_VERISI}} yuvasına yerleştirilir;
// tüketim kuralları ANALIST_TALIMATI'nın Bölüm 2'sindedir.

// Sunucudaki nano özetçi kotasız kalırsa (raw:true) ham bloğu cihaz anahtarıyla
// özetleriz. gpt-5-nano: OpenAI'da sk-…, OpenRouter'da sk-or-… anahtarla çalışır.
// Şema, araştırma ekibinin çıktı şemasıyla uyumlu (kompakt).
export const NANO_OZET_GOREVI =
  "Görev: Yukarıdaki ham web sonuçlarını araştırma ekibi şemasına çevir:\n" +
  "## SON DAKİKA — her at için: `at adı — bilgi (kaynak adı)` veya `yok`\n" +
  "## UZMAN TABLOSU — her satır: `[n] kaynak adı | URL | yayın tarihi veya 'belirsiz' | ağırlık | gösterdiği atlar | tek cümle`\n" +
  "## PİST NOTU — tek kısa paragraf (yoksa 'yok')\n" +
  "## BULUNAMAYANLAR — hangi atlar için ne bulunamadı (tek satırlık liste)\n" +
  "Uydurma yasak; ham metinde olmayan bilgiyi yazma. Türkçe, kompakt.";

export async function nanoSentezCihaz(icerik: string, apiKey: string): Promise<string> {
  if (!icerik || !apiKey) return "";
  const talimat =
    "Sen bir araştırma editörüsün: verilen ham web sonuçlarını yapılandırılmış kısa özete çevirirsin. " +
    "Uydurma yasak: kaynakta olmayan bilgiyi yazmazsın; olmayanı 'yok' olarak işaretlersin.\n\n" +
    `${icerik}\n\n---\n${NANO_OZET_GOREVI}`;
  const openRouter = isOpenRouterKey(apiKey);
  const url = openRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const body: Record<string, unknown> = openRouter
    ? {
        model: "openai/gpt-5-nano",
        max_tokens: 2000,
        messages: [{ role: "user", content: talimat }],
      }
    : {
        model: "gpt-5-nano",
        max_completion_tokens: 2000,
        messages: [{ role: "user", content: talimat }],
      };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (openRouter) {
    try {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Ganian";
    } catch {
      /* yok say */
    }
  }
  try {
    const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await r.text();
    if (!r.ok) return "";
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return "";
    }
    return (
      (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() || ""
    );
  } catch {
    return "";
  }
}

// OpenRouter: OpenAI ile uyumlu /chat/completions uç noktası (Responses API yok).

// OpenRouter: OpenAI ile uyumlu /chat/completions uç noktası (Responses API yok).
// Cihaz anahtarı sk-or-… ise analiz doğrudan OpenRouter'a gider. Web araştırması
// Tavily/Sonar'dan gelmişse (haveResearch) arama eklentisi eklenmez.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouterDevice(
  prompt: string,
  apiKey: string,
  model: string,
  effort: string,
  haveResearch = false,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  try {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Ganian";
  } catch {
    /* yok say */
  }
  const wantReason = !/^(none|minimal)$/i.test(effort) && /^(gpt-6|gpt-5|o[134])/i.test(model);
  const rEffort = effort === "xhigh" ? "high" : effort;
  const maxOut = model.toLowerCase().includes("3.5") ? 4000 : /^(gpt-6|gpt-5|o)/i.test(model) ? 16000 : 8192;

  for (let attempt = 1; attempt <= 4; attempt++) {
    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
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
          max_tokens: maxOut,
          ...(!haveResearch ? { plugins: [{ id: "web" }] } : {}),
          ...(wantReason ? { reasoning: { effort: rEffort } } : {}),
        }),
      });
    } catch {
      throw new Error("OpenRouter'a ulaşılamadı (ağ hatası). İnternet/adblock kontrol et ya da sunucu anahtarını kullan.");
    }
    const text = await res.text();
    if (res.ok) {
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`OpenRouter geçersiz yanıt döndü (HTTP ${res.status})`);
      }
      const out =
        (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() || "";
      if (!out) throw new Error("OpenRouter boş yanıt döndü. Tekrar deneyin.");
      return out;
    }
    // reasoning desteklemeyen model: muhakemesiz bir kez daha dene
    if (wantReason && /reasoning|effort/i.test(text)) {
      continue;
    }
    if (/429|rate limit|tokens per min|try again/i.test(text) && attempt < 4) {
      await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 20000)));
      continue;
    }
    throw openAiError(text, res.status);
  }
  throw new Error("OpenRouter isteği başarısız. Tekrar deneyin.");
}

export async function callGpt(
  prompt: string,
  apiKey: string,
  modelOverride?: string,
  effortOverride?: string,
  haveResearch = false,
): Promise<string> {
  const model = modelOverride || getGptModel();
  const effort = effortOverride || getGptEffort();

  // 0) Önce sunucudaki gömülü anahtarı dene (anahtar tarayıcıya hiç verilmez).
  // Cihazda anahtar varsa sağlayıcısını da bildiririz; sunucuda o sağlayıcının
  // anahtarı yoksa (501 NO_SERVER_KEY) cihaz anahtarıyla devam eder.
  try {
    const r = await fetch("/api/analiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model,
        effort,
        haveResearch,
        provider: apiKey ? (isOpenRouterKey(apiKey) ? "openrouter" : "openai") : undefined,
      }),
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
    // yoksa (sunucu kapalı / anahtar yok) cihaz anahtarıyla doğrudan sağlayıcıya düş.
    if (e instanceof Error && /401|403|429|Kota|geçersiz|reddedildi/i.test(e.message)) throw e;
  }

  if (!apiKey) {
    throw new Error(
      "Sunucuda API anahtarı yok ve cihazda anahtar girilmedi. Önce server'a OPENAI_API_KEY ya da OPENROUTER_API_KEY tanımla, ya da Analiz penceresinden anahtar gir (sk-… OpenAI, sk-or-… OpenRouter).",
    );
  }

  // OpenRouter anahtarı (sk-or-…): doğrudan OpenRouter'a git
  if (isOpenRouterKey(apiKey)) {
    return callOpenRouterDevice(prompt, apiKey, model, effort, haveResearch);
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
        ...(haveResearch ? {} : { tools: [{ type: "web_search" }] }),
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
          ...(haveResearch ? {} : { tools: [{ type: "web_search" }] }),
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
