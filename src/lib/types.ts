export type TrackKind = "cim" | "kum" | "sentetik" | "diger";
export type DistanceBucket = "kisa" | "orta" | "uzun";

export type SurfaceStat = { starts: number; wins: number; winPct: number };
export type SurfaceDistanceStats = {
  bySurface: Record<"cim" | "kum" | "sentetik", SurfaceStat>;
  byDistance: Record<DistanceBucket, SurfaceStat>;
  bestSurface: "cim" | "kum" | "sentetik" | null;
  bestDistance: DistanceBucket | null;
  sample: number;
};

export type Favorites = { bestSurface: "cim" | "kum" | "sentetik" | null; bestDistance: DistanceBucket | null };

export type Weather = {
  hippodrome: string;
  city: string;
  night: boolean;
  sky: string;
  temp: number | null;
  humidity: number | null;
  turf: string;
  turfDepth: number | null;
  dirt: string;
  dirtDepth: number | null;
};

export type Equipment = { key: string; description: string };

export type HorseEntry = {
  id: string;
  key: string;
  name: string;
  number: string;
  stall: string;
  ageText: string;
  ageEn: string;
  kg: number | null;
  extraKg: string;
  apprenticeDeduction: number | null;
  hp: string;
  kgs: string;
  jockeyId: string;
  jockeyName: string;
  trainerId: string;
  trainerName: string;
  ownerId: string;
  ownerName: string;
  sire: string;
  sireId: string;
  dam: string;
  damId: string;
  damsire: string;
  breeder: string;
  silkUrl: string;
  form: string[];
  ganyan: string;
  agf: string;
  agfRank: number | null;
  equipment: Equipment[];
  scratched: boolean;
  coupled: boolean;
  bestTime: string;
  position: string;
  time: string;
  margin: string;
};

export type Race = {
  id: string;
  no: string;
  time: string;
  date: string;
  distance: string;
  track: TrackKind;
  trackLabel: string;
  group: string;
  raceType: string;
  gender: string;
  info: string;
  bets: string;
  prizes: string[];
  breedersPrizes: string[];
  bestTime: string;
  bestTimeNote: string;
  named: string;
  last800: string;
  videoUrl: string;
  photoUrl: string;
  horses: HorseEntry[];
  finished: boolean;
};

export type Meeting = {
  key: string;
  code: string;
  name: string;
  city: string;
  night: boolean;
  dayNo: string | null;
  domestic: boolean;
  weather: Weather | null;
  races: Race[];
};

export type DayCard = { date: string; meetings: Meeting[]; error?: string };

export type CareerLine = {
  label: string;
  starts: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  earnings: string;
};

export type PastRace = {
  date: string;
  dateIso: string;
  city: string;
  distance: string;
  trackLabel: string;
  track: TrackKind;
  position: string;
  time: string;
  kg: string;
  equipment: string;
  jockeyName: string;
  jockeyId: string;
  stall: string;
  odds: string;
  group: string;
  raceNo: string;
  raceName: string;
  raceType: string;
  trainerName: string;
  trainerId: string;
  ownerName: string;
  ownerId: string;
  hp: string;
  prize: string;
  field: string;
  videoPage: string;
  videoKosuKod: string;
  photoUrl: string;
};

export type HorseProfile = {
  id: string;
  name: string;
  ageText: string;
  birthDate: string;
  hp: string;
  sire: string;
  sireId: string;
  dam: string;
  damsire: string;
  trainer: string;
  trainerId: string;
  owner: string;
  ownerId: string;
  runningOwner: string;
  breeder: string;
  color: string;
  sex: string;
  career: CareerLine[];
  races: PastRace[];
  surfaceStats: SurfaceDistanceStats;
  error?: string;
};

export type JockeyRide = {
  date: string;
  dateIso: string;
  city: string;
  meetingKey: string;
  raceId: string;
  raceNo: string;
  raceTime: string;
  raceType: string;
  group: string;
  distance: string;
  track: TrackKind;
  trackLabel: string;
  horseId: string;
  horseName: string;
  kg: number | null;
  hp: string;
  position: string;
  time: string;
  odds: string;
  videoUrl: string;
  videoPage: string;
};

export type JockeyPeriod = {
  label: string;
  starts: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  winPct: string;
  placePct: string;
  showPct: string;
};

export type JockeyProfile = {
  id: string;
  name: string;
  licenseType: string;
  birthDate: string;
  city: string;
  periods: JockeyPeriod[];
  starts: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  winPct: string;
  placePct: string;
  showPct: string;
  rides: JockeyRide[];
  surfaceStats: SurfaceDistanceStats;
  error?: string;
};

export type PersonProfile = {
  id: string;
  kind: "antrenor" | "sahip";
  name: string;
  horses: { id: string; name: string }[];
  error?: string;
};

export type SearchHit = {
  kind: "at" | "jokey" | "antrenor" | "sahip";
  id: string;
  name: string;
  extra: string;
};

export type Region = "tr" | "dunya";

export type Siblings = { sire: string; horses: { id: string; name: string }[]; source: "tjk" | "yakin-donem" | "yok" };

export type LeaderboardRow = { id: string; name: string; starts: number; wins: number; winPct: number };
export type Leaderboard = { days: number; jockeys: LeaderboardRow[]; trainers: LeaderboardRow[] };
