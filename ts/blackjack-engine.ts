/* =========================================================
   BJE — محرك البلاك جاك (قواعد بحتة، من غير أي DOM أو Firebase).
   بيتستخدم في الأوفلاين (blackjack.js) وفي الأونلاين (online-blackjack.js)
   بنفس الكود بالظبط، فالدلر البشري والدلر الآلي بيلعبوا بنفس القواعد.
   المصدر TypeScript في ts/ والملف الجاهز js/blackjack-engine.js (بيتبني بـ: cd ts && tsc -p .)
========================================================= */


namespace BJE {
  export type Card = string; // مثال: "AS" "10H" "KD"
  export type Phase =
    | "BETTING" | "DEALING" | "INITIAL_CHECK" | "INSURANCE"
    | "PLAYER_TURNS" | "DEALER_TURN" | "SETTLEMENT" | "ROUND_COMPLETE";
  export type Action = "hit" | "stand" | "double" | "split" | "surrender";
  export type Outcome = "win" | "loss" | "push" | "surrender" | "blackjack";
  export type Rng = (n: number) => number; // بيرجّع عدد صحيح من 0 لحد n-1

  export const RULES = {
    DECKS: 6,
    RESHUFFLE_BELOW: 52,   // قبل أي جولة جديدة بس
    MAX_HANDS: 4,
    MIN_BET: 1,
    MAX_BET: 1000000000,
    BET_STEP: 1,
    INSURANCE_PAY: 2       // 2:1
  };
  export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  export const SUITS = ["S", "H", "D", "C"];

  /* ---------- عشوائية ---------- */
  export function randInt(n: number): number {
    const c: any = typeof crypto !== "undefined" ? crypto : null;
    if (c && c.getRandomValues) {
      const lim = Math.floor(4294967296 / n) * n; // رفض القيم اللي بتعمل انحياز
      const a = new Uint32Array(1);
      do { c.getRandomValues(a); } while (a[0] >= lim);
      return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  export function shuffle<T>(arr: T[], rng?: Rng): T[] {
    const r = rng || randInt, a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = r(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- الورق والشوز ---------- */
  export function rankOf(c: Card): string { return c.slice(0, -1); }
  export function suitOf(c: Card): string { return c.slice(-1); }
  export function cardValue(rankOrCard: string): number {
    const r = RANKS.indexOf(rankOrCard) >= 0 ? rankOrCard : rankOf(rankOrCard);
    if (r === "A") return 11;
    if (r === "J" || r === "Q" || r === "K" || r === "10") return 10;
    return parseInt(r, 10);
  }
  export function createShoe(decks?: number): Card[] {
    const n = decks || RULES.DECKS, s: Card[] = [];
    for (let d = 0; d < n; d++) for (const su of SUITS) for (const r of RANKS) s.push(r + su);
    return s;
  }
  export function freshShoe(rng?: Rng): Card[] { return shuffle(createShoe(RULES.DECKS), rng); }
  /* بتتنادى في أول جولة جديدة بس: لو الشوز أقل من 52 ورقة بنعمل شوز جديد */
  export function prepareShoe(shoe: Card[] | null | undefined, rng?: Rng): { shoe: Card[]; reshuffled: boolean } {
    if (!shoe || shoe.length < RULES.RESHUFFLE_BELOW) return { shoe: freshShoe(rng), reshuffled: true };
    return { shoe: shoe, reshuffled: false };
  }

  /* ---------- قيمة اليد ---------- */
  export interface HandValue { total: number; soft: boolean; bust: boolean; blackjack: boolean; label: string; }
  export function evaluate(cards: Card[]): HandValue {
    let sum = 0, aces = 0;
    for (const c of cards) {
      const r = rankOf(c);
      if (r === "A") { aces++; sum += 1; } else sum += cardValue(r);
    }
    let total = sum, soft = false;
    if (aces > 0 && sum + 10 <= 21) { total = sum + 10; soft = true; }
    const bust = total > 21;
    const blackjack = cards.length === 2 && aces === 1 && sum === 11;
    const label = bust ? "Bust " + total : blackjack ? "Blackjack" : (soft ? "Soft " : "Hard ") + total;
    return { total, soft, bust, blackjack, label };
  }
  /* الدلر: يسحب لو أقل من 17، ويقف على 17 أو أكتر (Soft 17 كمان) */
  export function dealerShouldHit(cards: Card[]): boolean { return evaluate(cards).total < 17; }

  /* ---------- اليد ---------- */
  export interface Hand {
    cards: Card[]; bet: number;
    fromSplit: boolean; splitAces: boolean; doubled: boolean;
    stood: boolean; surrendered: boolean; acted: boolean; done: boolean;
  }
  export function newHand(bet: number, cards?: Card[]): Hand {
    return { cards: cards || [], bet: bet, fromSplit: false, splitAces: false, doubled: false, stood: false, surrendered: false, acted: false, done: false };
  }
  /* بلاك جاك طبيعي: اليد الأصلية، ورقتين بالظبط، آص + قيمة 10 (مش بعد سبليت ولا دابل) */
  export function isNatural(h: Hand): boolean {
    return !h.fromSplit && !h.doubled && h.cards.length === 2 && evaluate(h.cards).blackjack;
  }

  /* ---------- حالة الجولة ---------- */
  export interface Seat { id: string; uid: string; name: string; hands: Hand[]; insurance: number; insAsked: boolean; }
  export interface HandResult {
    idx: number; outcome: Outcome; bet: number; ret: number; net: number;
    cards: Card[]; total: number; bust: boolean; natural: boolean; doubled: boolean; fromSplit: boolean;
  }
  export interface SeatResult {
    id: string; uid: string; name: string; hands: HandResult[];
    ins: { amount: number; won: boolean; ret: number };
    staked: number; returned: number; net: number;
  }
  export interface Settlement { dealerTotal: number; dealerBust: boolean; dealerBJ: boolean; seats: SeatResult[]; }
  export interface Round {
    id: string; phase: Phase; shoe: Card[]; dealer: Card[]; holeShown: boolean;
    seats: Seat[]; turn: { s: number; h: number } | null;
    dealerBJ: boolean; peeked: boolean; reshuffled: boolean; result: Settlement | null;
  }
  export interface Entrant { id: string; uid?: string; name?: string; bet: number; }
  export interface Res { ok: boolean; err?: string; extra?: number; }

  export function validBet(b: number, min?: number, max?: number): boolean {
    const lo = min || RULES.MIN_BET, hi = max || RULES.MAX_BET;
    return typeof b === "number" && isFinite(b) && Math.floor(b) === b && b >= lo && b <= hi && b % RULES.BET_STEP === 0;
  }

  function draw(r: Round): Card {
    const c = r.shoe.pop();
    if (!c) throw new Error("shoe empty"); // مفروض مبيحصلش: الشوز بيتجدد قبل الجولة لو أقل من 52
    return c;
  }

  /* ---------- بداية الجولة + التوزيع ---------- */
  export function startRound(o: { id: string; shoe: Card[] | null; entrants: Entrant[]; rng?: Rng; minBet?: number; maxBet?: number }): Round {
    if (!o.entrants.length) throw new Error("no players");
    o.entrants.forEach(e => { if (!validBet(e.bet, o.minBet, o.maxBet)) throw new Error("bad bet"); });
    const p = prepareShoe(o.shoe, o.rng);
    const r: Round = {
      id: o.id, phase: "DEALING", shoe: p.shoe, dealer: [], holeShown: false,
      seats: o.entrants.map(e => ({ id: e.id, uid: e.uid || "", name: e.name || "", hands: [newHand(e.bet)], insurance: 0, insAsked: false })),
      turn: null, dealerBJ: false, peeked: false, reshuffled: p.reshuffled, result: null
    };
    // التوزيع: لاعب 1، دلر (مكشوفة)، لاعب 2، دلر (مخفية) — كله حسب الدور
    r.seats.forEach(s => s.hands[0].cards.push(draw(r)));
    r.dealer.push(draw(r));
    r.seats.forEach(s => s.hands[0].cards.push(draw(r)));
    r.dealer.push(draw(r));
    r.phase = "INITIAL_CHECK";
    initialCheck(r);
    return r;
  }

  function initialCheck(r: Round): void {
    const up = rankOf(r.dealer[0]);
    if (up === "A") { r.phase = "INSURANCE"; return; }           // التأمين الأول وبعدين الدلر يفحص
    if (cardValue(up) === 10) { peek(r); return; }               // الدلر يفحص قبل أي حركة
    beginPlayerTurns(r);
  }
  function peek(r: Round): void {
    r.peeked = true;
    r.dealerBJ = evaluate(r.dealer).blackjack;
    if (r.dealerBJ) { r.holeShown = true; r.turn = null; finish(r); return; }
    beginPlayerTurns(r);
  }
  function finish(r: Round): void { r.result = settle(r); r.phase = "SETTLEMENT"; r.turn = null; }

  function beginPlayerTurns(r: Round): void {
    r.phase = "PLAYER_TURNS";
    r.seats.forEach(s => s.hands.forEach(h => { if (isNatural(h)) { h.stood = true; h.done = true; } }));
    r.turn = { s: 0, h: 0 };
    advance(r, true);
  }

  /* ---------- التأمين (لما ورقة الدلر آص بس) ---------- */
  export function insuranceMax(bet: number): number { return Math.floor(bet / 2); }
  export function setInsurance(r: Round, seatIdx: number, amount: number): Res {
    if (r.phase !== "INSURANCE" || rankOf(r.dealer[0]) !== "A") return { ok: false, err: "no insurance now" };
    const s = r.seats[seatIdx];
    if (!s || s.insAsked) return { ok: false, err: "already answered" };
    const max = insuranceMax(s.hands[0].bet);
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount < 0 || amount > max) return { ok: false, err: "bad insurance amount" };
    s.insurance = amount; s.insAsked = true;
    if (r.seats.every(x => x.insAsked)) peek(r);
    return { ok: true, extra: amount };
  }

  /* ---------- اللي مسموح للاعب ---------- */
  export interface Legal { hit: boolean; stand: boolean; double: boolean; split: boolean; surrender: boolean; }
  export function curHand(r: Round, seatIdx: number): Hand | null {
    if (r.phase !== "PLAYER_TURNS" || !r.turn || r.turn.s !== seatIdx) return null;
    return r.seats[seatIdx].hands[r.turn.h] || null;
  }
  /* نفس القواعد على أي يد (يد المحرك أو يد من publicView) — الأونلاين بيستخدمها عشان الزراير تطابق قرار المضيف */
  export interface HandLike { cards: Card[]; bet: number; doubled: boolean; splitAces: boolean; done: boolean; surrendered: boolean; fromSplit: boolean; stood?: boolean; }
  export function legalFor(h: HandLike, nHands: number, balance?: number): Legal {
    const none: Legal = { hit: false, stand: false, double: false, split: false, surrender: false };
    if (!h || h.done || h.stood || h.surrendered) return none;
    const ev = evaluate(h.cards);
    if (ev.bust) return none;
    const bal = balance === undefined ? Infinity : balance;
    const two = h.cards.length === 2;
    const natural = !h.fromSplit && !h.doubled && two && ev.blackjack;
    return {
      hit: !h.splitAces && !h.doubled && ev.total < 21,
      stand: true,
      double: two && !h.splitAces && !h.doubled && bal >= h.bet,   // ورقتين = محصلش Hit قبل كده
      split: two && !h.splitAces && cardValue(h.cards[0]) === cardValue(h.cards[1]) && nHands < RULES.MAX_HANDS && bal >= h.bet,
      surrender: two && nHands === 1 && !h.fromSplit && !h.doubled && !h.splitAces && !natural
    };
  }
  export function legal(r: Round, seatIdx: number, balance?: number): Legal {
    const h = curHand(r, seatIdx);
    if (!h) return { hit: false, stand: false, double: false, split: false, surrender: false };
    return legalFor(h, r.seats[seatIdx].hands.length, balance);
  }

  /* ---------- تنفيذ حركة ---------- */
  export function act(r: Round, seatIdx: number, action: Action, balance?: number): Res {
    const L = legal(r, seatIdx, balance);
    if (!L[action]) return { ok: false, err: "illegal action" };
    const seat = r.seats[seatIdx], hi = r.turn!.h, h = seat.hands[hi];
    let extra = 0;
    if (action === "hit") {
      h.cards.push(draw(r)); h.acted = true;
      const ev = evaluate(h.cards);
      if (ev.bust) h.done = true;
      else if (ev.total === 21) { h.stood = true; h.done = true; }
    } else if (action === "stand") {
      h.stood = true; h.done = true;
    } else if (action === "double") {
      extra = h.bet; h.bet = h.bet * 2; h.doubled = true; h.acted = true;
      h.cards.push(draw(r)); h.done = true; // كارت واحد وبعدها Stand أوتوماتيك
    } else if (action === "split") {
      extra = h.bet;
      const aces = rankOf(h.cards[0]) === "A";
      const a = newHand(h.bet, [h.cards[0]]), b = newHand(h.bet, [h.cards[1]]);
      a.fromSplit = b.fromSplit = true; a.splitAces = b.splitAces = aces;
      a.cards.push(draw(r)); b.cards.push(draw(r)); // كل يد بتاخد ورقة واحدة
      [a, b].forEach(x => {
        if (aces || evaluate(x.cards).total === 21) { x.stood = true; x.done = true; } // آصات السبليت: ورقة واحدة وStand
      });
      seat.hands.splice(hi, 1, a, b);
    } else if (action === "surrender") {
      h.surrendered = true; h.done = true;
    }
    advance(r, false);
    return { ok: true, extra: extra };
  }

  /* الدور اللي بعده: اليد الجاية في نفس اللاعب، بعدين اللاعب اللي بعده، بعدين الدلر */
  function advance(r: Round, fromStart: boolean): void {
    if (!r.turn) return;
    let s = r.turn.s, h = r.turn.h;
    for (; s < r.seats.length; s++, h = 0) {
      const hands = r.seats[s].hands;
      for (; h < hands.length; h++) if (!hands[h].done) { r.turn = { s: s, h: h }; return; }
    }
    r.turn = null; r.phase = "DEALER_TURN";
  }

  /* ---------- دور الدلر ---------- */
  /* الدلر بيسحب بس لو فيه يد لسه حيّة (مش Bust ولا استسلام ولا بلاك جاك طبيعي) */
  export function needsDealerDraw(r: Round): boolean {
    return r.seats.some(s => s.hands.some(h => !h.surrendered && !isNatural(h) && !evaluate(h.cards).bust));
  }
  /* خطوة واحدة: كشف الورقة المخفية ← سحب ← وقوف. بترجّع done لما الدلر يخلص وتتحسب النتيجة. */
  export function dealerStep(r: Round): { done: boolean; act: "reveal" | "hit" | "stand" | "none"; card?: Card } {
    if (r.phase !== "DEALER_TURN") return { done: r.phase === "SETTLEMENT" || r.phase === "ROUND_COMPLETE", act: "none" };
    if (!r.holeShown) { r.holeShown = true; return { done: false, act: "reveal" }; }
    if (needsDealerDraw(r) && dealerShouldHit(r.dealer)) { const c = draw(r); r.dealer.push(c); return { done: false, act: "hit", card: c }; }
    finish(r);
    return { done: true, act: "stand" };
  }
  export function dealerPlay(r: Round): void { let g = 0; while (!dealerStep(r).done && ++g < 60) { /* loop */ } }

  /* ---------- الحسم ---------- */
  export function settleHand(h: Hand, dealer: Card[]): HandResult {
    const ev = evaluate(h.cards), dEv = evaluate(dealer), dBJ = dealer.length === 2 && dEv.blackjack, nat = isNatural(h);
    let outcome: Outcome, ret: number;
    if (h.surrendered) { outcome = "surrender"; ret = Math.floor(h.bet / 2); }
    else if (ev.bust) { outcome = "loss"; ret = 0; }
    else if (nat) {
      if (dBJ) { outcome = "push"; ret = h.bet; } else { outcome = "blackjack"; ret = h.bet + Math.floor(h.bet * 3 / 2); }
    }
    else if (dBJ) { outcome = "loss"; ret = 0; }
    else if (dEv.bust) { outcome = "win"; ret = h.bet * 2; }
    else if (ev.total > dEv.total) { outcome = "win"; ret = h.bet * 2; }
    else if (ev.total < dEv.total) { outcome = "loss"; ret = 0; }
    else { outcome = "push"; ret = h.bet; }
    return { idx: 0, outcome: outcome, bet: h.bet, ret: ret, net: ret - h.bet, cards: h.cards.slice(), total: ev.total, bust: ev.bust, natural: nat, doubled: h.doubled, fromSplit: h.fromSplit };
  }
  export function settle(r: Round): Settlement {
    const dEv = evaluate(r.dealer), dBJ = r.dealer.length === 2 && dEv.blackjack;
    const seats: SeatResult[] = r.seats.map(s => {
      const hands = s.hands.map((h, i) => { const x = settleHand(h, r.dealer); x.idx = i; return x; });
      const won = dBJ && s.insurance > 0;
      const ins = { amount: s.insurance, won: won, ret: won ? s.insurance + s.insurance * RULES.INSURANCE_PAY : 0 };
      const staked = hands.reduce((a, x) => a + x.bet, 0) + s.insurance;
      const returned = hands.reduce((a, x) => a + x.ret, 0) + ins.ret;
      return { id: s.id, uid: s.uid, name: s.name, hands: hands, ins: ins, staked: staked, returned: returned, net: returned - staked };
    });
    return { dealerTotal: dEv.total, dealerBust: dEv.bust, dealerBJ: dBJ, seats: seats };
  }

  /* ---------- نسخة عامة للاعبين: الورقة المخفية والشوز مش بيتبعتوا ---------- */
  export function publicView(r: Round): any {
    const dEv = r.holeShown ? evaluate(r.dealer) : null;
    return {
      id: r.id, phase: r.phase, holeShown: r.holeShown, shoeLeft: r.shoe.length, reshuffled: r.reshuffled,
      dealer: r.holeShown ? r.dealer.slice() : [r.dealer[0], null],
      dealerTotal: dEv ? dEv.total : null, dealerLabel: dEv ? dEv.label : null,
      peeked: r.peeked, dealerBJ: r.peeked ? r.dealerBJ : null,
      turn: r.turn,
      seats: r.seats.map(s => ({
        id: s.id, uid: s.uid, name: s.name, insurance: s.insurance, insAsked: s.insAsked,
        hands: s.hands.map(h => { const e = evaluate(h.cards); return { cards: h.cards.slice(), bet: h.bet, doubled: h.doubled, fromSplit: h.fromSplit, splitAces: h.splitAces, done: h.done, surrendered: h.surrendered, natural: isNatural(h), total: e.total, label: e.label, bust: e.bust }; })
      })),
      result: r.result
    };
  }

  /* ---------- أدوات الاختبار: شوز مظبوط (أول ورقة هتتوزع = أول عنصر) ---------- */
  export function rig(order: Card[]): Card[] {
    const filler: Card[] = [];
    for (let i = 0; i < 80; i++) filler.push("2C");
    return filler.concat(order.slice().reverse());
  }
}
