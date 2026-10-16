/* =========================================================
   SNAKES & LADDERS (سلم وتعبان) — محرك القواعد.
   مفيش DOM ولا Firebase هنا: القواعد بس، دوال صافية على كائن JSON.
   نفس المحرك بيشغّل الأوفلاين والأونلاين.

   الأونلاين (زي لودو بالظبط): محدش بيبعت نتيجة نرد ولا مكان.
   كل لاعب بيكتب قراراته هو بس (سجل حروف)، وكل جهاز بيعيد تشغيل نفس السجل:
     - النرد: الرمية رقم k = دالة ثابتة من seed الغرفة (diceFor).
     - الكروت والأحداث العشوائية: نفس الفكرة (عدّاد rk + seed).
     - اللوحة نفسها (سلالم/تعابين/خانات خاصة) بتتولّد من الـ seed.
   قرار غير قانوني بيتتجاهل في الإعادة.

   حروف السجل (كل قرار = حرف + بارامتر ثابت الطول):
     r        ارمي النرد
     u<s>     العب كارت من خانة اليد s (0-2)
     t<p>     اختار لاعب p (هدف / ضحية)
     j<NN>    اختار سلم/تعبان رقم NN
     c<NN>    اختار خانة NN
     d        سحب من الكومة (كارت اسحب)
     z        إلغاء اختيار الهدف
     A / B    اختار النرد الأول / التاني (النرد المزوّر)
     f<n>     طريق التفرع 0 سريع · 1 آمن · 2 كنز
     x<n>     كارت زيادة: n = خانة اليد اللي تتشال، 3 = ارمي الكارت الجديد
     w        استخدم الدرع الأخضر (ward)
     a<s>     استخدم كارت دفاع من خانة s
     n        مفيش دفاع (خد الضربة)
========================================================= */
namespace SNE {
  export type Style = "classic" | "chaos";
  export type Level = "easy" | "mid" | "hard";
  export interface Opts { style: Style; surv: boolean; full: boolean; }
  export type CardId = "flip" | "cut" | "hunt" | "swap" | "loaded" | "shield" | "draw" | "tback" | "tskip" | "tsteal" | "tfake";
  export type TrapT = "tback" | "tskip" | "tsteal" | "tfake";
  export type SpT = "treasure" | "curse" | "gate" | "steal" | "ward" | "fork";
  export type HitKind = "snake" | "curse" | "trap" | "steal" | "swap" | "tax" | "ambush";

  export interface Jump { id: number; from: number; to: number; cut: number; }
  export interface Special { cell: number; t: SpT; to?: number; }
  export interface Trap { id: number; cell: number; owner: number; tt: TrapT; exp: number; }
  export interface Stats { gap: number; used: number; wardUsed: number; dodged: number; steals: number; sprung: number; bites: number; climbs: number; }
  export interface Player { pos: number; hearts: number; hand: CardId[]; ward: number; skip: number; ghost: boolean; fin: boolean; st: Stats; }
  export interface Hit { kind: HitKind; from?: number; to?: number; jid?: number; back?: number; cell?: number; tt?: TrapT; owner?: number; by?: number; heart?: boolean; }
  export interface Pend { t: "roll" | "target" | "steal" | "pick" | "fork" | "discard" | "defend" | "over"; seat: number; card?: CardId; slot?: number; hit?: Hit; a?: number; b?: number; incoming?: CardId; }
  export interface QItem { k: "land" | "hit" | "treasure" | "endTurn" | "startTurn" | "resume" | "world" | "gain"; seat?: number; cell?: number; hit?: Hit; card?: CardId; via?: string; }
  export interface Ev { t: string; [k: string]: any; }
  export interface Game {
    v: number; seed: number; n: number; opts: Opts;
    jumps: Jump[]; sp: Special[]; traps: Trap[]; trapId: number;
    players: Player[]; turn: number; round: number; turnNo: number;
    pend: Pend | null; q: QItem[];
    cardUsed: boolean; loaded: boolean; flips: number; fx: { [k: string]: number };
    dk: number; rk: number; ak: number; seq: number;
    ranking: number[]; elim: number[]; over: boolean; winner: number; lastWorld: string;
  }

  export const MAXHAND = 3;
  export const MAXHEART = 4;
  export const WORLD_EVERY = 5;
  export const FINISH = 100;

  /* ---------- الكروت ---------- */
  export type Tgt = "none" | "seat" | "jump" | "cell" | "draw" | "react";
  export interface CardDef { id: CardId; en: string; ar: string; d: string; tgt: Tgt; w: number; tone: string; }
  export const CARDS: { [k: string]: CardDef } = {
    hunt:   { id: "hunt",   en: "Snake Catcher", ar: "صيد التعبان",  d: "Cancels one snake bite. Plays itself when a snake gets you.",             tgt: "react", w: 13, tone: "green" },
    shield: { id: "shield", en: "Lucky Shield",  ar: "درع الحظ",     d: "Blocks one trap, curse, steal, swap or penalty. Not snakes.",             tgt: "react", w: 13, tone: "blue" },
    draw:   { id: "draw",   en: "Draw a Card",   ar: "اسحب كارتًا",   d: "Take a card from the deck, or steal a random one from an opponent.",       tgt: "draw",  w: 9,  tone: "gold" },
    cut:    { id: "cut",    en: "Cut the Ladder", ar: "اقطع السلم",  d: "A ladder is out of use for 3 rounds. Only one can be cut at a time.",       tgt: "jump",  w: 9,  tone: "orange" },
    swap:   { id: "swap",   en: "Swap Places",   ar: "بدّل مكاني",    d: "Trade places with a player. Not inside the last 10 squares.",              tgt: "seat",  w: 9,  tone: "violet" },
    loaded: { id: "loaded", en: "Loaded Dice",   ar: "النرد المزوّر", d: "Roll twice this turn and keep the roll you like.",                          tgt: "none",  w: 7,  tone: "gold" },
    tback:  { id: "tback",  en: "Trap: Setback", ar: "فخ الرجوع",     d: "Hidden trap. Whoever lands on it goes back 5 squares.",                      tgt: "cell",  w: 7,  tone: "red" },
    tskip:  { id: "tskip",  en: "Trap: Freeze",  ar: "فخ التجميد",    d: "Hidden trap. Whoever lands on it loses their next turn.",                    tgt: "cell",  w: 6,  tone: "red" },
    tsteal: { id: "tsteal", en: "Trap: Thief",   ar: "فخ السرقة",     d: "Hidden trap. You steal a random card from whoever lands on it.",             tgt: "cell",  w: 6,  tone: "red" },
    tfake:  { id: "tfake",  en: "Trap: Bluff",   ar: "فخ مزيف",       d: "Looks like a trap, does nothing. Make them worry.",                          tgt: "cell",  w: 5,  tone: "red" },
    flip:   { id: "flip",   en: "Flip the Table", ar: "اقلب الطاولة", d: "Flip one snake into a ladder, or a ladder into a snake. Twice per match.",  tgt: "jump",  w: 3,  tone: "violet" }
  };
  export const CARD_IDS: string[] = ["hunt", "shield", "draw", "cut", "swap", "loaded", "tback", "tskip", "tsteal", "tfake", "flip"];
  const CARD_TOTAL = CARD_IDS.reduce((s, k) => s + CARDS[k].w, 0);

  export const SP_INFO: { [k: string]: { en: string; ar: string; d: string } } = {
    treasure: { en: "Treasure", ar: "كنز",    d: "Draw a card (in survival, sometimes a heart)." },
    curse:    { en: "Curse",    ar: "لعنة",   d: "Go back 4 squares." },
    gate:     { en: "Gate",     ar: "بوابة",  d: "Teleports you to the matching gate." },
    steal:    { en: "Pickpocket", ar: "سرقة", d: "Steal a random card from a player." },
    ward:     { en: "Shrine",   ar: "حماية",  d: "Gain a ward that cancels one bad effect, even a snake." },
    fork:     { en: "Fork",     ar: "تفرع",   d: "Choose: fast (+6, lose next turn), safe (+2 and a ward) or treasure (a card, risk of ambush)." }
  };

  export const WORLD_IDS: string[] = ["gift", "tax", "headwind", "season", "sleepy"];
  export const WORLD_INFO: { [k: string]: { en: string; ar: string; d: string } } = {
    gift:     { en: "Gift Day",        ar: "هدية للجميع",   d: "Everyone with room in their hand draws a card." },
    tax:      { en: "Leader's Tax",    ar: "ضريبة المتصدر", d: "The leader goes back 5 squares." },
    headwind: { en: "Headwind",        ar: "رياح عكسية",    d: "Every roll counts 1 less this round (min 1)." },
    season:   { en: "Ladder Season",   ar: "موسم السلالم",  d: "Ladders lift you 3 squares higher this round." },
    sleepy:   { en: "Sleepy Snakes",   ar: "ثعابين نايمة",  d: "Snakes do not bite this round." }
  };

  /* ---------- عشوائية حتمية ---------- */
  function h32(a: number, b: number): number {
    let h = (a | 0) ^ Math.imul((b | 0) + 1, 0x9E3779B1);
    h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
    return h >>> 0;
  }
  export function diceFor(seed: number, k: number): number { return (h32(seed ^ 0x2D1CE, k) % 6) + 1; }
  function fracFor(seed: number, salt: number, k: number): number { return h32(seed ^ salt, k) / 4294967296; }
  function R(g: Game): number { return fracFor(g.seed, 0x7A11, g.rk++); }
  function mulberry(a: number): () => number {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- هندسة اللوحة: خانة 1 تحت شمال، بتروح يمين وبعدين الصف اللي فوقه شمال... ---------- */
  export function rowOf(c: number): number { return Math.floor((c - 1) / 10); }
  export function cellXY(c: number): [number, number] {          // [col 0..9, row 0..9 من تحت]
    const r = rowOf(c), i = (c - 1) % 10;
    return [r % 2 === 0 ? i : 9 - i, r];
  }

  /* ---------- توليد اللوحة من الـ seed ---------- */
  export interface Board { jumps: Jump[]; sp: Special[]; }
  export function genBoard(seed: number, style: Style): Board {
    for (let attempt = 0; attempt < 40; attempt++) {
      const b = tryBoard(seed + attempt * 7919, style);
      if (b) return b;
    }
    return tryBoard(seed, style, true) as Board;
  }
  function tryBoard(seed: number, style: Style, force?: boolean): Board | null {
    const rnd = mulberry(seed ^ 0x5A17);
    const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
    const chaos = style === "chaos";
    const used: { [c: number]: boolean } = { 1: true, 100: true };
    const raw: { from: number; to: number }[] = [];
    const nS = chaos ? ri(7, 8) : ri(8, 9), nL = chaos ? ri(6, 7) : ri(8, 9);
    function snake(hmin: number, hmax: number, dmin: number, dmax: number): boolean {
      for (let t = 0; t < 300; t++) {
        const head = ri(hmin, hmax), tail = head - ri(dmin, dmax);
        if (tail < 2 || rowOf(head) === rowOf(tail) || used[head] || used[tail]) continue;
        used[head] = used[tail] = true; raw.push({ from: head, to: tail }); return true;
      }
      return false;
    }
    function ladder(): boolean {
      for (let t = 0; t < 300; t++) {
        const bot = ri(2, 80), top = bot + ri(9, 45);
        if (top > 98 || rowOf(top) === rowOf(bot) || used[bot] || used[top]) continue;
        used[bot] = used[top] = true; raw.push({ from: bot, to: top }); return true;
      }
      return false;
    }
    let ok = true;
    ok = snake(90, 99, 12, 40) && ok;          // تعبان طويل قرب النهاية
    ok = snake(76, 92, 14, 45) && ok;
    for (let i = 2; i < nS; i++) ok = snake(18, 99, 9, 52) && ok;
    ok = ladder() && ok;
    for (let i = 1; i < nL; i++) ok = ladder() && ok;
    if (!ok && !force) return null;
    const lad = raw.filter(j => j.to > j.from).length, sn = raw.length - lad;
    if (!force && (lad < (chaos ? 5 : 7) || sn < (chaos ? 6 : 7))) return null;
    raw.sort((a, b) => Math.min(a.from, a.to) - Math.min(b.from, b.to));
    const jumps: Jump[] = raw.map((j, i) => ({ id: i, from: j.from, to: j.to, cut: 0 }));
    const sp: Special[] = [];
    if (chaos) {
      const free = (c: number) => !used[c] && c >= 3 && c <= 98;
      function put(t: SpT, lo: number, hi: number, to?: number): number {
        for (let k = 0; k < 400; k++) {
          const c = ri(lo, hi);
          if (!free(c)) continue;
          used[c] = true; sp.push(to === undefined ? { cell: c, t: t } : { cell: c, t: t, to: to }); return c;
        }
        return 0;
      }
      let good = true;
      for (let i = 0; i < 2; i++) {          // بوابتين (زوجين)
        let placed = false;
        for (let k = 0; k < 400 && !placed; k++) {
          const a = ri(8, 62), b = ri(a + 14, 96);
          if (b > 96 || !free(a) || !free(b)) continue;
          used[a] = used[b] = true; sp.push({ cell: a, t: "gate", to: b }); sp.push({ cell: b, t: "gate", to: a }); placed = true;
        }
        good = good && placed;
      }
      good = (put("fork", 25, 75) > 0) && good;
      for (let i = 0; i < 4; i++) good = (put("treasure", 4, 96) > 0) && good;
      for (let i = 0; i < 3; i++) good = (put("curse", 8, 96) > 0) && good;
      for (let i = 0; i < 2; i++) good = (put("steal", 8, 96) > 0) && good;
      for (let i = 0; i < 2; i++) good = (put("ward", 6, 90) > 0) && good;
      if (!good && !force) return null;
    }
    return { jumps: jumps, sp: sp };
  }

  /* ---------- إنشاء مباراة ---------- */
  function newStats(): Stats { return { gap: 0, used: 0, wardUsed: 0, dodged: 0, steals: 0, sprung: 0, bites: 0, climbs: 0 }; }
  export function init(n: number, opts: Partial<Opts>, seed: number, first: number): Game {
    n = Math.max(2, Math.min(4, n | 0));
    const style: Style = opts.style === "classic" ? "classic" : "chaos";
    const o: Opts = { style: style, surv: style === "chaos" && !!opts.surv, full: !!opts.full };
    const b = genBoard(seed | 0, style);
    const players: Player[] = [];
    for (let i = 0; i < n; i++) players.push({ pos: 0, hearts: o.surv ? 3 : 0, hand: [], ward: 0, skip: 0, ghost: false, fin: false, st: newStats() });
    const g: Game = {
      v: 1, seed: seed | 0, n: n, opts: o, jumps: b.jumps, sp: b.sp, traps: [], trapId: 1,
      players: players, turn: Math.max(0, Math.min(n - 1, first | 0)), round: 1, turnNo: 1,
      pend: null, q: [], cardUsed: false, loaded: false, flips: 0, fx: {},
      dk: 0, rk: 0, ak: 0, seq: 0, ranking: [], elim: [], over: false, winner: -1, lastWorld: ""
    };
    g.pend = { t: "roll", seat: g.turn };
    return g;
  }

  /* ---------- أدوات قراءة ---------- */
  export const isActive = (g: Game, s: number) => !g.players[s].ghost && !g.players[s].fin;
  export const activeSeats = (g: Game) => g.players.map((_, i) => i).filter(i => isActive(g, i));
  export function jumpAt(g: Game, c: number): Jump | null { for (const j of g.jumps) if (j.from === c) return j; return null; }
  export function jumpEnd(g: Game, c: number): Jump | null { for (const j of g.jumps) if (j.to === c) return j; return null; }
  export function spAt(g: Game, c: number): Special | null { for (const s of g.sp) if (s.cell === c) return s; return null; }
  export function trapAt(g: Game, c: number): Trap | null { for (const t of g.traps) if (t.cell === c) return t; return null; }
  export const fxOn = (g: Game, id: string) => g.fx[id] !== undefined && g.fx[id] >= g.round;
  export const isLadder = (j: Jump) => j.to > j.from;
  const cutActive = (g: Game) => g.jumps.some(j => j.cut > 0);

  function drawCard(g: Game): CardId {
    let x = R(g) * CARD_TOTAL;
    for (const k of CARD_IDS) { x -= CARDS[k].w; if (x < 0) return k as CardId; }
    return "hunt";
  }

  /* ---------- مين يقدر يعمل إيه ---------- */
  function pawnAt(g: Game, c: number): boolean { return g.players.some(p => !p.ghost && p.pos === c); }
  function flippable(g: Game, j: Jump): boolean {
    if (j.cut) return false;
    const nf = j.to;
    if (nf < 2 || nf > 99 || spAt(g, nf) || trapAt(g, nf)) return false;
    return true;
  }
  export function trapCells(g: Game): number[] {
    const out: number[] = [];
    for (let c = 2; c <= 99; c++) if (!jumpAt(g, c) && !jumpEnd(g, c) && !spAt(g, c) && !trapAt(g, c) && !pawnAt(g, c)) out.push(c);
    return out;
  }
  export function canPlay(g: Game, s: number, card: CardId): boolean {
    const P = g.players[s], d = CARDS[card];
    if (!d || d.tgt === "react") return false;
    switch (card) {
      case "cut": return !cutActive(g) && g.jumps.some(j => isLadder(j) && !j.cut);
      case "flip": return g.flips < 2 && g.jumps.some(j => flippable(g, j));
      case "swap": return P.pos >= 1 && P.pos < 90 && g.players.some((q, i) => i !== s && !q.ghost && !q.fin && q.pos >= 1 && q.pos < 90 && q.pos !== P.pos);
      case "draw": return true;
      case "loaded": return P.pos < 99;
      default: return g.traps.filter(t => t.owner === s).length < 2 && trapCells(g).length > 0;
    }
  }
  export function targets(g: Game, s: number, card: CardId): string[] {
    const out: string[] = [], P = g.players[s];
    const pad = (n: number) => (n < 10 ? "0" : "") + n;
    switch (card) {
      case "cut": g.jumps.forEach(j => { if (isLadder(j) && !j.cut) out.push("j" + pad(j.id)); }); break;
      case "flip": g.jumps.forEach(j => { if (flippable(g, j)) out.push("j" + pad(j.id)); }); break;
      case "swap": g.players.forEach((q, i) => { if (i !== s && !q.ghost && !q.fin && q.pos >= 1 && q.pos < 90 && q.pos !== P.pos) out.push("t" + i); }); break;
      case "draw": out.push("d"); g.players.forEach((q, i) => { if (i !== s && !q.ghost && !q.fin && q.hand.length > 0) out.push("t" + i); }); break;
      default: trapCells(g).forEach(c => out.push("c" + pad(c)));
    }
    return out;
  }
  export function defenseOptions(g: Game, s: number, hit: Hit): string[] {
    const P = g.players[s], out: string[] = [];
    if (P.ward > 0) out.push("w");
    P.hand.forEach((c, i) => { if (hit.kind === "snake" ? c === "hunt" : c === "shield") out.push("a" + i); });
    return out;
  }
  export function legal(g: Game): string[] {
    const p = g.pend;
    if (!p || g.over) return [];
    const s = p.seat, P = g.players[s];
    let out: string[] = [];
    switch (p.t) {
      case "roll":
        out.push("r");
        if (!g.cardUsed && g.opts.style === "chaos") P.hand.forEach((c, i) => { if (canPlay(g, s, c)) out.push("u" + i); });
        break;
      case "target": out = targets(g, s, p.card as CardId); out.push("z"); break;
      case "steal": g.players.forEach((q, i) => { if (i !== s && !q.ghost && !q.fin && q.hand.length > 0) out.push("t" + i); }); break;
      case "pick": out = ["A", "B"]; break;
      case "fork": out = ["f0", "f1", "f2"]; break;
      case "discard": P.hand.forEach((_, i) => out.push("x" + i)); out.push("x3"); break;
      case "defend": out = defenseOptions(g, s, p.hit as Hit); out.push("n"); break;
      default: break;
    }
    return out;
  }
  const TL: { [c: string]: number } = { r: 1, u: 2, t: 2, j: 3, c: 3, d: 1, w: 1, a: 2, n: 1, z: 1, A: 1, B: 1, f: 2, x: 2 };
  export function readTok(L: string, i: number): string {
    const n = TL[L.charAt(i)];
    if (!n) return "";
    const t = L.substr(i, n);
    return t.length === n ? t : "";
  }

  /* ---------- تغييرات الحالة ---------- */
  function gainCard(g: Game, s: number, card: CardId, ev: Ev[], via: string): void {
    const P = g.players[s];
    if (P.ghost) return;
    if (P.hand.length < MAXHAND) { P.hand.push(card); ev.push({ t: "gain", seat: s, card: card, via: via }); return; }
    if (s === g.turn && via !== "gift") { g.pend = { t: "discard", seat: s, incoming: card }; ev.push({ t: "full", seat: s, card: card, via: via }); return; }
    ev.push({ t: "drop", seat: s, card: card, via: via });
  }
  function loseHeart(g: Game, s: number, ev: Ev[]): void {
    const P = g.players[s];
    if (!g.opts.surv || P.ghost) return;
    P.hearts--; ev.push({ t: "heart", seat: s, d: -1, left: P.hearts });
    if (P.hearts <= 0) {
      P.ghost = true; P.pos = 0; P.hand = []; P.ward = 0; P.skip = 0;
      g.traps = g.traps.filter(t => t.owner !== s);
      g.elim.push(s); ev.push({ t: "ghost", seat: s });
      checkEnd(g, ev);
    }
  }
  function setPos(g: Game, s: number, to: number): void { g.players[s].pos = Math.max(0, Math.min(99, to)); }
  function stealFrom(g: Game, victim: number, thief: number, ev: Ev[], src: string): void {
    const V = g.players[victim];
    if (!V.hand.length) { ev.push({ t: "nothing", seat: thief, why: "empty", victim: victim }); return; }
    const idx = Math.floor(R(g) * V.hand.length);
    const card = V.hand.splice(idx, 1)[0];
    ev.push({ t: "steal", from: victim, to: thief, card: card, src: src });
    g.players[thief].st.steals++;
    if (!g.players[thief].ghost) gainCard(g, thief, card, ev, "steal");
  }

  function applyHit(g: Game, s: number, h: Hit, ev: Ev[]): void {
    const P = g.players[s];
    switch (h.kind) {
      case "snake": {
        const from = P.pos; P.pos = h.to as number; P.st.bites++;
        ev.push({ t: "bite", seat: s, from: h.from, to: h.to, jid: h.jid });
        if (h.heart) loseHeart(g, s, ev);
        break;
      }
      case "curse": case "tax": case "ambush": {
        const from = P.pos; setPos(g, s, Math.max(1, P.pos - (h.back || 0)));
        ev.push({ t: "back", seat: s, from: from, to: P.pos, why: h.kind });
        if (h.heart) loseHeart(g, s, ev);
        break;
      }
      case "trap": {
        const o = h.owner as number;
        if (h.tt === "tback") {
          const from = P.pos; setPos(g, s, Math.max(1, P.pos - 5));
          ev.push({ t: "back", seat: s, from: from, to: P.pos, why: "trap" });
          if (h.heart) loseHeart(g, s, ev);
        } else if (h.tt === "tskip") {
          P.skip++; ev.push({ t: "freeze", seat: s });
          if (h.heart) loseHeart(g, s, ev);
        } else if (h.tt === "tsteal") {
          if (!g.players[o].ghost) stealFrom(g, s, o, ev, "trap");
        } else ev.push({ t: "nothing", seat: s, why: "fake" });
        break;
      }
      case "steal": stealFrom(g, s, h.by as number, ev, h.cell === 1 ? "card" : "square"); break;
      case "swap": {
        const b = h.by as number, B = g.players[b], a = P.pos;
        P.pos = B.pos; B.pos = a;
        ev.push({ t: "swap", a: b, b: s, pa: B.pos, pb: P.pos });
        break;
      }
    }
  }

  function finish(g: Game, s: number, ev: Ev[]): void {
    const P = g.players[s];
    P.pos = FINISH; P.fin = true; g.ranking.push(s);
    ev.push({ t: "finish", seat: s, place: g.ranking.length });
    checkEnd(g, ev);
  }
  function checkEnd(g: Game, ev: Ev[]): void {
    if (g.over) return;
    const alive = g.players.map((_, i) => i).filter(i => !g.players[i].ghost);
    const active = activeSeats(g);
    let over = false;
    if (g.ranking.length > 0 && !g.opts.full) over = true;
    else if (g.opts.full && active.length <= 1) over = true;
    else if (g.opts.surv && g.elim.length > 0 && alive.length === 1) over = true;
    if (!over) return;
    const rank = g.ranking.slice();
    g.players.map((_, i) => i).filter(i => !g.players[i].ghost && rank.indexOf(i) < 0)
      .sort((a, b) => g.players[b].pos - g.players[a].pos || a - b).forEach(i => rank.push(i));
    g.elim.slice().reverse().forEach(i => { if (rank.indexOf(i) < 0) rank.push(i); });
    g.ranking = rank; g.winner = rank[0]; g.over = true; g.pend = { t: "over", seat: -1 }; g.q = [];
    ev.push({ t: "over", winner: g.winner, ranking: rank.slice() });
  }

  /* ---------- طابور التأثيرات ---------- */
  function hitFor(g: Game, s: number, h: Hit): QItem { return { k: "hit", seat: s, hit: h }; }
  function run(g: Game, ev: Ev[]): void {
    let guard = 0;
    while (!g.pend && g.q.length && !g.over && guard++ < 600) {
      const it = g.q.shift() as QItem;
      exec(g, it, ev);
    }
  }
  function exec(g: Game, it: QItem, ev: Ev[]): void {
    switch (it.k) {
      case "land": land(g, it.seat as number, it.cell as number, ev); break;
      case "hit": {
        const s = it.seat as number, h = it.hit as Hit;
        if (g.players[s].ghost) break;
        if (defenseOptions(g, s, h).length) { g.pend = { t: "defend", seat: s, hit: h }; ev.push({ t: "threat", seat: s, hit: h }); }
        else applyHit(g, s, h, ev);
        break;
      }
      case "treasure": {
        const s = it.seat as number, P = g.players[s];
        if (g.opts.surv && P.hearts < MAXHEART && R(g) < 0.2) { P.hearts++; ev.push({ t: "heart", seat: s, d: 1, left: P.hearts }); }
        else gainCard(g, s, drawCard(g), ev, "treasure");
        break;
      }
      case "resume": if (!g.over) g.pend = { t: "roll", seat: it.seat as number }; break;
      case "startTurn": startTurn(g, ev); break;
      case "endTurn": endTurn(g, ev); break;
      case "world": worldEvent(g, ev); break;
      default: break;
    }
  }
  function startTurn(g: Game, ev: Ev[]): void {
    if (g.over) return;
    g.turnNo++; g.cardUsed = false; g.loaded = false;
    const P = g.players[g.turn];
    let lead = 0; activeSeats(g).forEach(i => { lead = Math.max(lead, g.players[i].pos); });
    P.st.gap = Math.max(P.st.gap, lead - P.pos);
    g.pend = { t: "roll", seat: g.turn };
    ev.push({ t: "turn", seat: g.turn, round: g.round });
  }
  function endTurn(g: Game, ev: Ev[]): void {
    if (g.over) return;
    const n = g.n, extras: QItem[] = [];
    let guard = 0;
    for (;;) {
      if (guard++ > 64) break;
      const prev = g.turn;
      let s = prev, tries = 0;
      do { s = (s + 1) % n; tries++; } while (!isActive(g, s) && tries <= n);
      const wrap = s <= prev;
      g.turn = s;
      if (wrap) {
        g.round++;
        g.traps = g.traps.filter(t => { if (g.round > t.exp) { ev.push({ t: "trapExpire", cell: t.cell, owner: t.owner }); return false; } return true; });
        g.jumps.forEach(j => { if (j.cut && g.round > j.cut) { j.cut = 0; ev.push({ t: "mend", jid: j.id }); } });
        ev.push({ t: "round", n: g.round });
        if (g.opts.style === "chaos" && g.round % WORLD_EVERY === 0) extras.push({ k: "world" });
      }
      const P = g.players[s];
      if (P.skip > 0) { P.skip--; ev.push({ t: "skip", seat: s }); continue; }
      break;
    }
    extras.push({ k: "startTurn" });
    g.q = extras.concat(g.q);
  }
  function worldEvent(g: Game, ev: Ev[]): void {
    let id = WORLD_IDS[Math.floor(R(g) * WORLD_IDS.length)];
    if (id === g.lastWorld) id = WORLD_IDS[(WORLD_IDS.indexOf(id) + 1) % WORLD_IDS.length];
    g.lastWorld = id;
    ev.push({ t: "world", id: id, round: g.round });
    if (id === "gift") activeSeats(g).forEach(i => { if (g.players[i].hand.length < MAXHAND) gainCard(g, i, drawCard(g), ev, "gift"); });
    else if (id === "tax") {
      let top = 0; activeSeats(g).forEach(i => { top = Math.max(top, g.players[i].pos); });
      if (top >= 10) {
        const L = activeSeats(g).filter(i => g.players[i].pos === top);
        g.q = L.map(i => hitFor(g, i, { kind: "tax", back: 5 })).concat(g.q);
      } else ev.push({ t: "nothing", why: "tax" });
    } else g.fx[id] = g.round;
  }

  /* ---------- الهبوط على خانة ---------- */
  function land(g: Game, s: number, cell: number, ev: Ev[]): void {
    const P = g.players[s];
    if (P.ghost || P.fin) return;
    const tr = g.traps.filter(t => t.cell === cell && t.owner !== s)[0];
    if (tr) {
      g.traps = g.traps.filter(t => t !== tr);
      ev.push({ t: "trapHit", seat: s, cell: cell, owner: tr.owner, tt: tr.tt });
      g.players[tr.owner].st.sprung++;
      const heart = g.opts.surv && (tr.tt === "tback" || tr.tt === "tskip");
      g.q.unshift(hitFor(g, s, { kind: "trap", tt: tr.tt, owner: tr.owner, cell: cell, heart: heart }));
      return;
    }
    const j = jumpAt(g, cell);
    if (j) {
      if (j.cut) { ev.push({ t: "cutBlock", seat: s, jid: j.id }); return; }
      if (isLadder(j)) {
        let to = j.to, bonus = 0;
        if (fxOn(g, "season")) { bonus = Math.min(99, to + 3) - to; to += bonus; }
        P.pos = to; P.st.climbs++;
        ev.push({ t: "climb", seat: s, from: j.from, to: to, jid: j.id, bonus: bonus });
      } else if (fxOn(g, "sleepy")) {
        ev.push({ t: "sleepy", seat: s, jid: j.id });
      } else {
        g.q.unshift(hitFor(g, s, { kind: "snake", from: j.from, to: j.to, jid: j.id, heart: g.opts.surv && j.from - j.to >= 25 }));
      }
      return;
    }
    const sp = spAt(g, cell);
    if (!sp) return;
    ev.push({ t: "special", seat: s, cell: cell, sp: sp.t });
    switch (sp.t) {
      case "treasure": g.q.unshift({ k: "treasure", seat: s }); break;
      case "curse": g.q.unshift(hitFor(g, s, { kind: "curse", back: 4, heart: g.opts.surv })); break;
      case "gate": P.pos = sp.to as number; ev.push({ t: "gate", seat: s, from: cell, to: P.pos }); break;
      case "ward":
        if (P.ward < 1) { P.ward = 1; ev.push({ t: "ward", seat: s }); } else ev.push({ t: "nothing", seat: s, why: "haveward" });
        break;
      case "steal": {
        const C = g.players.map((_, i) => i).filter(i => i !== s && !g.players[i].ghost && !g.players[i].fin && g.players[i].hand.length > 0);
        if (!C.length) ev.push({ t: "nothing", seat: s, why: "nopockets" });
        else if (C.length === 1) g.q.unshift(hitFor(g, C[0], { kind: "steal", by: s }));
        else g.pend = { t: "steal", seat: s };
        break;
      }
      case "fork": g.pend = { t: "fork", seat: s }; break;
    }
  }

  /* ---------- الرمية والحركة ---------- */
  function move(g: Game, s: number, d: number, ev: Ev[]): void {
    const P = g.players[s];
    let eff = d;
    if (fxOn(g, "headwind")) eff = Math.max(1, d - 1);
    if (eff !== d) ev.push({ t: "headwind", seat: s, d: d, eff: eff });
    const to = P.pos + eff;
    if (to > FINISH) { ev.push({ t: "exact", seat: s, d: eff }); g.q.push({ k: "endTurn" }); return; }
    const from = P.pos; P.pos = to;
    ev.push({ t: "move", seat: s, from: from, to: to, d: eff });
    if (to === FINISH) { finish(g, s, ev); if (!g.over) g.q.push({ k: "endTurn" }); return; }
    g.q.push({ k: "land", seat: s, cell: to }, { k: "endTurn" });
  }
  function playCard(g: Game, s: number, slot: number, card: CardId, tok: string, ev: Ev[]): void {
    const P = g.players[s];
    P.hand.splice(slot, 1);
    g.cardUsed = true; P.st.used++;
    const c = tok.charAt(0), a = tok.slice(1);
    ev.push({ t: "play", seat: s, card: card, tok: tok });
    switch (card) {
      case "cut": { const j = g.jumps[+a]; j.cut = g.round + 3; ev.push({ t: "cut", seat: s, jid: j.id, until: j.cut }); break; }
      case "flip": {
        const j = g.jumps[+a], f = j.from; j.from = j.to; j.to = f; g.flips++;
        ev.push({ t: "flip", seat: s, jid: j.id, from: j.from, to: j.to });
        break;
      }
      case "swap": g.q.push(hitFor(g, +a, { kind: "swap", by: s })); break;
      case "draw":
        if (c === "d") gainCard(g, s, drawCard(g), ev, "draw");
        else g.q.push(hitFor(g, +a, { kind: "steal", by: s, cell: 1 }));
        break;
      case "loaded": g.loaded = true; break;
      default: {
        const cell = +a;
        g.traps.push({ id: g.trapId++, cell: cell, owner: s, tt: card as TrapT, exp: g.round + 10 });
        ev.push({ t: "trapSet", seat: s, cell: cell, tt: card });
      }
    }
    g.q.push({ k: "resume", seat: s });
  }

  /* ---------- تنفيذ قرار ---------- */
  export function apply(g: Game, tok: string): Ev[] | null {
    if (g.over || !g.pend || legal(g).indexOf(tok) < 0) return null;
    const ev: Ev[] = [], p = g.pend, s = p.seat, P = g.players[s];
    const c = tok.charAt(0), a = tok.slice(1);
    g.pend = null; g.seq++;
    switch (p.t) {
      case "roll": {
        if (c === "r") {
          const d1 = diceFor(g.seed, g.dk++);
          if (g.loaded) {
            const d2 = diceFor(g.seed, g.dk++); g.loaded = false;
            ev.push({ t: "roll", seat: s, d: d1, d2: d2, loaded: true });
            g.pend = { t: "pick", seat: s, a: d1, b: d2 };
          } else { ev.push({ t: "roll", seat: s, d: d1 }); move(g, s, d1, ev); }
        } else {
          const slot = +a, card = P.hand[slot];
          if (CARDS[card].tgt === "none") {
            P.hand.splice(slot, 1); g.cardUsed = true; P.st.used++; g.loaded = true;
            ev.push({ t: "play", seat: s, card: card, tok: tok });
            g.pend = { t: "roll", seat: s };
          } else g.pend = { t: "target", seat: s, card: card, slot: slot };
        }
        break;
      }
      case "target": {
        if (c === "z") { g.pend = { t: "roll", seat: s }; break; }
        playCard(g, s, p.slot as number, p.card as CardId, tok, ev);
        break;
      }
      case "steal": g.q.unshift(hitFor(g, +a, { kind: "steal", by: s })); break;
      case "pick": move(g, s, c === "A" ? (p.a as number) : (p.b as number), ev); break;
      case "fork": {
        const r = +a;
        ev.push({ t: "route", seat: s, r: r });
        if (r === 0) { const from = P.pos; setPos(g, s, P.pos + 6); P.skip++; ev.push({ t: "boost", seat: s, from: from, to: P.pos }); }
        else if (r === 1) {
          const from = P.pos; setPos(g, s, P.pos + 2); ev.push({ t: "boost", seat: s, from: from, to: P.pos });
          if (P.ward < 1) { P.ward = 1; ev.push({ t: "ward", seat: s }); }
        } else {
          gainCard(g, s, drawCard(g), ev, "treasure");
          if (R(g) < 1 / 3) g.q.unshift(hitFor(g, s, { kind: "ambush", back: 3 }));
          else ev.push({ t: "nothing", seat: s, why: "calm" });
        }
        break;
      }
      case "discard": {
        const i = +a, inc = p.incoming as CardId;
        if (i >= P.hand.length) ev.push({ t: "drop", seat: s, card: inc, via: "decline" });
        else { const old = P.hand[i]; P.hand[i] = inc; ev.push({ t: "swapcard", seat: s, out: old, card: inc }); }
        break;
      }
      case "defend": {
        const h = p.hit as Hit;
        if (c === "n") { applyHit(g, s, h, ev); break; }
        let by = "ward";
        if (c === "w") P.ward--;
        else { by = P.hand[+a]; P.hand.splice(+a, 1); }
        P.st.wardUsed++; if (h.kind === "snake") P.st.dodged++;
        ev.push({ t: "defend", seat: s, by: by, hit: h });
        break;
      }
      default: break;
    }
    run(g, ev);
    return ev;
  }

  /* =========================================================
     الكمبيوتر (CPU) — حتمي: نفس الحالة = نفس القرار عند كل الأجهزة
  ========================================================= */
  const pLand = (pos: number, cell: number) => { const d = cell - pos; return d >= 1 && d <= 6 ? 1 / 6 : (d >= 7 && d <= 12 ? 1 / 12 : 0); };
  function finalPos(g: Game, s: number, cell: number): number {
    if (cell >= FINISH) return 1000;
    const j = jumpAt(g, cell);
    if (j && !j.cut) return j.to;
    const sp = spAt(g, cell);
    let v = cell;
    if (sp) {
      if (sp.t === "gate") v = sp.to as number;
      else if (sp.t === "curse") v = Math.max(1, cell - 4);
      else if (sp.t === "treasure" || sp.t === "ward") v = cell + 3;
      else if (sp.t === "steal") v = cell + 2;
      else if (sp.t === "fork") v = cell + 4;
    }
    const tr = trapAt(g, cell);
    if (tr && tr.owner !== s) v -= 4;
    return v;
  }
  const CARD_VAL: { [k: string]: number } = { shield: 6, hunt: 6, swap: 5, flip: 5, cut: 4, tback: 4, tskip: 4, draw: 3, loaded: 3, tsteal: 3, tfake: 2 };
  function jval(g: Game, s: number, from: number, to: number, who: number): number {
    return pLand(g.players[who].pos, from) * (to - from) * 6;
  }
  interface Play { score: number; tok: string; }
  function bestPlay(g: Game, s: number, card: CardId, lvl: Level): Play {
    const P = g.players[s], opp = g.players.map((_, i) => i).filter(i => i !== s && !g.players[i].ghost && !g.players[i].fin);
    let best: Play = { score: -99, tok: "" };
    const pad = (n: number) => (n < 10 ? "0" : "") + n;
    const take = (sc: number, tok: string) => { if (sc > best.score) best = { score: sc, tok: tok }; };
    if (card === "loaded") return { score: P.pos < 94 ? 2.4 : 0, tok: "" };
    if (card === "draw") {
      take(2.2, "d");
      if (lvl !== "easy") opp.forEach(i => { if (g.players[i].hand.length > 0) take(2.6 + g.players[i].hand.length * 0.4 + (g.players[i].pos > P.pos ? 0.3 : 0), "t" + i); });
      return best;
    }
    if (card === "swap") {
      opp.forEach(i => { const q = g.players[i]; if (q.pos >= 1 && q.pos < 90 && P.pos >= 1 && P.pos < 90 && q.pos !== P.pos) take((q.pos - P.pos) / 6, "t" + i); });
      return best;
    }
    if (card === "cut") {
      g.jumps.forEach(j => {
        if (!isLadder(j) || j.cut) return;
        let sc = -jval(g, s, j.from, j.to, s);
        opp.forEach(i => { sc += jval(g, s, j.from, j.to, i); });
        take(sc / 1.6, "j" + pad(j.id));
      });
      return best;
    }
    if (card === "flip") {
      g.jumps.forEach(j => {
        if (!flippable(g, j)) return;
        let before = 0, after = 0;
        const evalFor = (who: number, sign: number) => {
          const b = jval(g, s, j.from, j.to, who), a2 = jval(g, s, j.to, j.from, who);
          return sign * (a2 - b);
        };
        before = evalFor(s, 1); after = 0; opp.forEach(i => { after += evalFor(i, -1); });
        take((before + after) / 1.6, "j" + pad(j.id));
      });
      return best;
    }
    const wt = card === "tback" ? 5 : card === "tskip" ? 3.5 : card === "tsteal" ? 3 : 0.5;
    trapCells(g).forEach(c => {
      let sc = 0;
      opp.forEach(i => { sc += pLand(g.players[i].pos, c) * wt * 4; });
      if (sc > 0) sc -= pLand(P.pos, c) * 2;
      take(sc, "c" + pad(c));
    });
    return best;
  }
  function aiPlayCard(g: Game, s: number, lvl: Level): string {
    const P = g.players[s];
    if (g.cardUsed || g.opts.style !== "chaos" || lvl === "easy" && g.ak % 3 !== 0) return "";
    const thr = lvl === "hard" ? 1.7 : 2.3;
    let bs = thr, bt = "";
    P.hand.forEach((c, i) => {
      if (!canPlay(g, s, c)) return;
      const sc = bestPlay(g, s, c, lvl).score + (lvl === "hard" ? 0.2 : 0);
      if (sc > bs) { bs = sc; bt = "u" + i; }
    });
    return bt;
  }
  export function ai(g: Game, lvl: Level): string {
    const p = g.pend;
    if (!p) return "";
    const L = legal(g), s = p.seat, P = g.players[s];
    g.ak++;
    const rr = fracFor(g.seed, 0xA1, g.ak);
    if (L.length === 1) return L[0];
    switch (p.t) {
      case "roll": { const pc = aiPlayCard(g, s, lvl); return pc && L.indexOf(pc) >= 0 ? pc : "r"; }
      case "target": {
        const bp = bestPlay(g, s, p.card as CardId, lvl);
        return bp.tok && L.indexOf(bp.tok) >= 0 ? bp.tok : "z";
      }
      case "steal": {
        let bi = L[0], bv = -1;
        L.forEach(t => { const q = g.players[+t.charAt(1)]; const v = q.hand.length + q.pos / 100; if (v > bv) { bv = v; bi = t; } });
        return bi;
      }
      case "pick": {
        const va = finalPos(g, s, P.pos + (p.a as number)), vb = finalPos(g, s, P.pos + (p.b as number));
        const ia = P.pos + (p.a as number) > FINISH ? -1 : va, ib = P.pos + (p.b as number) > FINISH ? -1 : vb;
        return ia >= ib ? "A" : "B";
      }
      case "fork": {
        if (lvl === "easy") return "f" + Math.floor(rr * 3);
        if (P.ward < 1) return "f1";
        if (P.pos + 6 > 92) return "f2";
        return P.hand.length < 2 ? "f2" : "f0";
      }
      case "discard": {
        const inc = p.incoming as CardId;
        let wi = 3, wv = CARD_VAL[inc] || 1;
        P.hand.forEach((c, i) => { const v = CARD_VAL[c] || 1; if (v < wv) { wv = v; wi = i; } });
        return "x" + wi;
      }
      case "defend": {
        const h = p.hit as Hit;
        const cards = L.filter(t => t.charAt(0) === "a"), ward = L.indexOf("w") >= 0;
        if (cards.length) return cards[0];
        if (ward && (lvl !== "easy" || rr < 0.7)) return "w";
        return "n";
      }
      default: return L[0];
    }
  }

  export function rankPoints(rank: number): number { return rank === 0 ? 10 : rank === 1 ? 7 : rank === 2 ? 5 : 0; }
  export function clone(g: Game): Game { return JSON.parse(JSON.stringify(g)); }

  /* =========================================================
     إعادة تشغيل الأونلاين: سجلات اللاعبين (حروف) -> حالة المباراة.
     bots[i] = رقم: أول (رقم) حرف من سجل اللاعب i يفضلوا، وبعدين الكمبيوتر يلعب مكانه.
  ========================================================= */
  export interface TraceItem { seat: number; tok: string; ev: Ev[]; bot: boolean; }
  export interface Replay { g: Game; trace: TraceItem[]; wait: { seat: number; need: string } | null; }
  export function replay(n: number, opts: Partial<Opts>, seed: number, first: number, logs: string[], bots: (number | null)[]): Replay {
    const g = init(n, opts, seed, first), trace: TraceItem[] = [], ptr: number[] = [], L: string[] = [];
    for (let i = 0; i < g.n; i++) {
      const b = bots[i];
      L.push(b != null ? String(logs[i] || "").slice(0, Math.max(0, b | 0)) : String(logs[i] || ""));
      ptr.push(0);
    }
    let guard = 0, wait: { seat: number; need: string } | null = null;
    while (!g.over && g.pend && guard++ < 20000) {
      const s = g.pend.seat, Ls = L[s];
      if (ptr[s] < Ls.length) {
        const tok = readTok(Ls, ptr[s]);
        if (!tok) { ptr[s]++; continue; }
        ptr[s] += tok.length;
        const ev = apply(g, tok);
        if (ev) trace.push({ seat: s, tok: tok, ev: ev, bot: false });
        continue;
      }
      if (bots[s] != null) {
        const tok = ai(g, "mid"), ev = apply(g, tok);
        if (!ev) break;
        trace.push({ seat: s, tok: tok, ev: ev, bot: true });
        continue;
      }
      wait = { seat: s, need: g.pend.t };
      break;
    }
    return { g: g, trace: trace, wait: wait };
  }
}
