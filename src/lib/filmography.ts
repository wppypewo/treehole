// 人物作品年表的純邏輯：合併 TMDB 的 cast／crew、依年份分組、組出角色文字。
// 不碰網路與金鑰，伺服器與測試都可以直接 import。

/** 年表一列需要的片子欄位。overview 等長欄位不帶，這份資料會送進瀏覽器 */
export interface CreditFilm {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  release_date: string;
}

/** TMDB /person/{id}/movie_credits 的 cast 一筆 */
export interface RawCastCredit extends CreditFilm {
  character?: string | null;
  order?: number | null;
}

/** TMDB /person/{id}/movie_credits 的 crew 一筆。同一部片擔任幾個職務就有幾筆 */
export interface RawCrewCredit extends CreditFilm {
  job?: string | null;
  department?: string | null;
}

export interface Credit {
  film: CreditFilm;
  /** 演出：角色名；幕後：職務的英文原文（顯示前再翻譯） */
  roles: string[];
  /** 只有演出有：TMDB 的卡司排序，0 是第一順位 */
  billing: number | null;
}

export interface Filmography {
  acting: Credit[];
  crew: Credit[];
}

// 這些職務不算作品：「Thanks」是片尾致謝名單，不是參與製作
const IGNORED_JOBS = new Set(["Thanks"]);

// 職務的排列先後。沒列到的排在後面，彼此照 TMDB 原本的順序
const JOB_RANK = [
  "Director",
  "Co-Director",
  "Screenplay",
  "Writer",
  "Story",
  "Novel",
  "Characters",
  "Producer",
  "Executive Producer",
  "Co-Producer",
  "Director of Photography",
  "Editor",
  "Original Music Composer",
];

function rankOf(job: string): number {
  const i = JOB_RANK.indexOf(job);
  return i === -1 ? JOB_RANK.length : i;
}

function pickFilm(m: CreditFilm): CreditFilm {
  return {
    id: m.id,
    title: m.title,
    original_title: m.original_title,
    poster_path: m.poster_path,
    release_date: m.release_date ?? "",
  };
}

/** 上映日新到舊；沒有日期的排最後 */
function byDateDesc(a: Credit, b: Credit): number {
  const da = a.film.release_date;
  const db = b.film.release_date;
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db.localeCompare(da);
}

/**
 * 把 TMDB 的 cast 與 crew 各自以片為單位合併。
 *
 * 同一部片在 cast 裡可能出現兩次（一人分飾兩角），在 crew 裡更常見
 * （同時導演、編劇、製片），合併後一部片只佔一列，角色或職務收在 roles。
 */
export function mergeCredits(
  cast: RawCastCredit[],
  crew: RawCrewCredit[],
): Filmography {
  const acting = new Map<number, Credit>();
  for (const c of cast) {
    const credit = acting.get(c.id) ?? {
      film: pickFilm(c),
      roles: [],
      billing: null,
    };
    const role = c.character?.trim();
    if (role && !credit.roles.includes(role)) credit.roles.push(role);
    if (typeof c.order === "number") {
      credit.billing =
        credit.billing === null ? c.order : Math.min(credit.billing, c.order);
    }
    acting.set(c.id, credit);
  }

  const behind = new Map<number, Credit>();
  for (const c of crew) {
    const job = c.job?.trim();
    if (!job || IGNORED_JOBS.has(job)) continue;
    const credit = behind.get(c.id) ?? {
      film: pickFilm(c),
      roles: [],
      billing: null,
    };
    if (!credit.roles.includes(job)) credit.roles.push(job);
    behind.set(c.id, credit);
  }
  for (const credit of behind.values()) {
    // sort 是穩定排序，同名次的職務保留 TMDB 原本的先後
    credit.roles.sort((a, b) => rankOf(a) - rankOf(b));
  }

  return {
    acting: [...acting.values()].sort(byDateDesc),
    crew: [...behind.values()].sort(byDateDesc),
  };
}

export interface YearGroup {
  /** 「2024」；沒有上映日的片為 null */
  year: string | null;
  credits: Credit[];
}

/** 依上映年份分組，新到舊；沒有日期的收成最後一組 */
export function groupByYear(credits: Credit[]): YearGroup[] {
  const sorted = [...credits].sort(byDateDesc);
  const groups: YearGroup[] = [];
  for (const credit of sorted) {
    const year = credit.film.release_date.slice(0, 4) || null;
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.credits.push(credit);
    else groups.push({ year, credits: [credit] });
  }
  return groups;
}

export interface RoleLabels {
  /** 「飾 {role}」／「as {role}」 */
  as: string;
  /** 演自己（紀錄片、訪談）：「本人」／「Self」 */
  self: string;
  /** 「（配音）」 */
  voice: string;
  /** 「（未掛名）」 */
  uncredited: string;
  /** 職務英文原文 → 顯示文字。沒有對應的照原文顯示 */
  jobs: Record<string, string>;
}

const SELF = /^(self|himself|herself|themselves|themself)\b/i;

/** 演的是自己：紀錄片與訪談片裡 TMDB 寫成「Self」「Himself」 */
export function isSelfRole(role: string): boolean {
  return SELF.test(role.trim());
}

function actingPart(role: string, labels: RoleLabels): string {
  let text = role;
  let suffix = "";
  // TMDB 把配音與未掛名寫在角色名後面的括號裡，英文，這裡換成當前語言
  text = text.replace(/\s*\((voice|uncredited)\)/gi, (_, kind: string) => {
    suffix += kind.toLowerCase() === "voice" ? labels.voice : labels.uncredited;
    return "";
  });
  text = text.trim();
  if (!text) return suffix.trim();
  if (isSelfRole(text)) return `${labels.self}${suffix}`;
  return `${labels.as.replace("{role}", text)}${suffix}`;
}

/** 演出列的角色文字：「飾 Bruce Wayne」「本人」「飾 Woody（配音）」 */
export function actingRoleText(roles: string[], labels: RoleLabels): string {
  return roles
    .map((r) => actingPart(r, labels))
    .filter(Boolean)
    .join(" / ");
}

/** 幕後列的職務文字：「導演 · 編劇 · 製片」。Screenplay 與 Writer 都譯成編劇時只留一個 */
export function crewRoleText(roles: string[], labels: RoleLabels): string {
  const out: string[] = [];
  for (const job of roles) {
    const label = labels.jobs[job] ?? job;
    if (!out.includes(label)) out.push(label);
  }
  return out.join(" · ");
}

/**
 * 主演：卡司排序前三位，且演的不是自己。
 * 紀錄片裡以本人身分入鏡、排在第一位，不算主演。
 */
export function isLeadRole(credit: Credit): boolean {
  return (
    credit.billing !== null &&
    credit.billing <= 2 &&
    credit.roles.length > 0 &&
    !credit.roles.every(isSelfRole)
  );
}
