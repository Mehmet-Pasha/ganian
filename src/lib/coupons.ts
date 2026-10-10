export type CouponStatus = "pending" | "won" | "lost";

export type BetType =
  | "ganyan"
  | "plase"
  | "plase-ikili"
  | "ikili"
  | "sirali-ikili"
  | "uclu"
  | "sirali-uclu"
  | "tabela-sirasiz"
  | "tabela"
  | "sirali-besli"
  | "cifte"
  | "ganyan-3"
  | "ganyan-4"
  | "ganyan-5"
  | "ganyan-6"
  | "karma-6"
  | "ganyan-7"
  | "plase-7";

export type BetMeta = {
  id: BetType;
  label: string;
  group: "tek" | "cok";
  legs: number; // kupondaki ayak sayısı
  minPicks: number; // tek koşulu oyunlarda en az seçim
  hint: string;
};

export const BET_TYPES: BetMeta[] = [
  { id: "ganyan", label: "Ganyan", group: "tek", legs: 1, minPicks: 1, hint: "Seçtiğin at birinci olursa kazanır." },
  { id: "plase", label: "Plase", group: "tek", legs: 1, minPicks: 1, hint: "Seçtiğin at ilk 2'ye girerse kazanır." },
  { id: "plase-ikili", label: "Plase İkili", group: "tek", legs: 1, minPicks: 2, hint: "Seçtiğin 2 at ilk 3'e girerse kazanır." },
  { id: "ikili", label: "İkili", group: "tek", legs: 1, minPicks: 2, hint: "Seçtiklerin ilk 2'yi (sırasız) bulursa kazanır." },
  { id: "sirali-ikili", label: "Sıralı İkili", group: "tek", legs: 1, minPicks: 2, hint: "İlk 2 seçimin 1. ve 2. ile aynı sırada olmalı." },
  { id: "uclu", label: "Üçlü Bahis", group: "tek", legs: 1, minPicks: 3, hint: "Seçtiklerin ilk 3'ü (sırasız) kapsarsa kazanır." },
  { id: "sirali-uclu", label: "Sıralı Üçlü", group: "tek", legs: 1, minPicks: 3, hint: "İlk 3 seçimin 1-2-3 ile aynı sırada olmalı." },
  { id: "tabela-sirasiz", label: "Tabela Bahis Sırasız", group: "tek", legs: 1, minPicks: 4, hint: "Seçtiklerin ilk 4'ü (sırasız) kapsarsa kazanır." },
  { id: "tabela", label: "Tabela Bahis", group: "tek", legs: 1, minPicks: 4, hint: "İlk 4 seçimin 1-2-3-4 ile aynı sırada olmalı." },
  { id: "sirali-besli", label: "Sıralı Beşli", group: "tek", legs: 1, minPicks: 5, hint: "İlk 5 seçimin 1-2-3-4-5 ile aynı sırada olmalı." },
  { id: "cifte", label: "Çifte", group: "cok", legs: 2, minPicks: 1, hint: "Üst üste 2 koşunun birincilerini bul." },
  { id: "ganyan-3", label: "3'lü Ganyan", group: "cok", legs: 3, minPicks: 1, hint: "Üst üste 3 koşunun birincilerini bul." },
  { id: "ganyan-4", label: "4'lü Ganyan", group: "cok", legs: 4, minPicks: 1, hint: "Üst üste 4 koşunun birincilerini bul." },
  { id: "ganyan-5", label: "5'li Ganyan", group: "cok", legs: 5, minPicks: 1, hint: "Üst üste 5 koşunun birincilerini bul." },
  { id: "ganyan-6", label: "6'lı Ganyan", group: "cok", legs: 6, minPicks: 1, hint: "Üst üste 6 koşunun birincilerini bul." },
  { id: "karma-6", label: "Karma 6'lı Ganyan", group: "cok", legs: 6, minPicks: 1, hint: "6 ayağın birincilerini bul (karma kurgu)." },
  { id: "ganyan-7", label: "7'li Ganyan", group: "cok", legs: 7, minPicks: 1, hint: "Üst üste 7 koşunun birincilerini bul." },
  { id: "plase-7", label: "7'li Plase", group: "cok", legs: 7, minPicks: 1, hint: "Üst üste 7 koşuda seçtiklerin ilk 2'ye girsin." },
];

export function betMeta(id: string): BetMeta {
  return BET_TYPES.find((b) => b.id === id) || BET_TYPES[0];
}

export type CouponLeg = {
  meetingKey: string;
  city: string;
  raceNo: string;
  horseIds: string[];
  horseNames: string[];
};

export type Coupon = {
  id: string;
  createdAt: string; // ISO
  dateISO: string;
  dateLabel: string;
  betType: BetType;
  legs: CouponLeg[];
  odds: number | null; // kullanıcı elle girer
  stake: number | null; // tutar (opsiyonel)
  status: CouponStatus;
  notified?: boolean;
};

const KEY = "mahmuz:kuponlar";
const MAX = 200;

function valid(a: unknown): a is Coupon {
  if (typeof a !== "object" || a === null) return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.dateISO === "string" &&
    Array.isArray(o.legs) &&
    typeof o.betType === "string"
  );
}

// Eski tek-at formatındaki kuponları yeni yapıya taşı
function migrate(a: unknown): Coupon | null {
  if (valid(a)) return a;
  if (typeof a !== "object" || a === null) return null;
  const o = a as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.horseName !== "string" || typeof o.dateISO !== "string") return null;
  const hid = typeof o.horseId === "string" && o.horseId ? o.horseId : String(o.horseNumber ?? "");
  return {
    id: o.id,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    dateISO: o.dateISO,
    dateLabel: typeof o.dateLabel === "string" ? o.dateLabel : o.dateISO,
    betType: "ganyan",
    legs: [
      {
        meetingKey: typeof o.meetingKey === "string" ? o.meetingKey : "",
        city: typeof o.city === "string" ? o.city : "",
        raceNo: typeof o.raceNo === "string" ? o.raceNo : "",
        horseIds: hid ? [hid] : [],
        horseNames: [o.horseName],
      },
    ],
    odds: typeof o.odds === "number" ? o.odds : null,
    stake: typeof o.stake === "number" ? o.stake : null,
    status: o.status === "won" || o.status === "lost" ? o.status : "pending",
    notified: o.notified === true,
  };
}

export function loadCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Coupon[] = [];
    for (const x of parsed) {
      const m = migrate(x);
      if (m) out.push(m);
    }
    return out;
  } catch {
    return [];
  }
}

function persist(items: Coupon[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* yok say */
  }
}

export function saveCoupon(c: Coupon): Coupon[] {
  const items = [c, ...loadCoupons().filter((x) => x.id !== c.id)];
  persist(items);
  return items;
}

export function updateCoupons(items: Coupon[]): Coupon[] {
  persist(items);
  return [...items];
}

export function deleteCoupon(id: string): Coupon[] {
  const items = loadCoupons().filter((x) => x.id !== id);
  persist(items);
  return items;
}

export function requestNotifyPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  } catch {
    /* yok say */
  }
}

export function notifyWin(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {
    /* yok say */
  }
}
