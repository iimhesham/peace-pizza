/* =========================================================
   SHK — شنكلولو: عملة الموقع (رصيد واحد لكل حساب جوجل).
   المحفظة والنقاط والقروض والإنجازات وإحصائيات البلاك جاك.
   كل تغيير في الرصيد بيعدّي من دالة واحدة (applyTx) جوه Transaction،
   وكل عملية ليها id فمستحيل تتنفذ مرتين (حتى لو الصفحة اتعملها refresh).
   اللعب الأوفلاين (تمرين) مالوش أي علاقة بالملف ده.
   المصدر TypeScript في ts/ والملف الجاهز js/shankalolo.js
========================================================= */

declare const firebase: any;

namespace SHK {
  export const START_BALANCE = 10000;
  export const POINT_RATE = 30;                 // 1 نقطة = 30 شنكلولو
  export const LOAN_LIMIT_RATIO = 0.5;          // 50% من أعلى رصيد في التاريخ
  export const LOANS_PER_MONTH = 2;
  export const LOAN_TERM_DAYS = 30;
  export const OVERDUE_BAN_DAYS = 7;
  export const FRIEND_LOAN_MAX = 50000;
  export const MIN_LOAN = 10;
  const DAY = 86400000;
  const MAX_CLAIM = 1000000000;                     // سقف أمان لأي تحويل وارد

  export interface Wallet { i: number; b: number; h: number; ap: { [id: string]: number }; t0: number; }
  export interface TxIn { id?: string; delta: number; reason?: string; }
  export interface Reduced { w: Wallet; status: "ok" | "dup" | "insufficient"; created: boolean; }

  /* ---------- دوال بحتة (بتتختبر من غير Firebase) ---------- */
  export function safeKey(s: string): string { return String(s).replace(/[.#$\[\]\/\s]/g, "_"); }
  export function pointsToShk(points: number): number { return Math.max(0, Math.floor(points)) * POINT_RATE; }
  export function monthKey(ts: number): string {
    const d = new Date(ts); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
  }
  export function newWallet(now: number): Wallet {
    return { i: 1, b: START_BALANCE, h: START_BALANCE, ap: { start: now }, t0: now };
  }
  /* المحفظة بعد عملية: الرصيد ما بيبقاش سالب، وأعلى رصيد ما بينزلش أبدًا، والعملية بتتنفذ مرة واحدة بس (حسب id) */
  export function reduce(cur: Wallet | null | undefined, tx: TxIn, now: number): Reduced {
    let created = false, w: Wallet;
    if (!cur || !cur.i) { w = newWallet(now); created = true; }   // المنحة الابتدائية مرة واحدة بس
    else w = { i: 1, b: cur.b || 0, h: cur.h || 0, ap: Object.assign({}, cur.ap || {}), t0: cur.t0 || now };
    const id = tx.id ? safeKey(tx.id) : "";
    if (id && w.ap[id]) return { w: w, status: "dup", created: created };
    const nb = w.b + tx.delta;
    if (!(nb >= 0) || Math.floor(nb) !== nb) return { w: w, status: "insufficient", created: created };
    w.b = nb;
    if (nb > w.h) w.h = nb;
    if (id) w.ap[id] = now;
    const keys = Object.keys(w.ap);
    if (keys.length > 400) {
      keys.filter(k => k !== "start" && k !== "conv30").sort((a, b) => w.ap[a] - w.ap[b]).slice(0, keys.length - 300).forEach(k => { delete w.ap[k]; });
    }
    return { w: w, status: "ok", created: created };
  }

  /* ---------- القروض الرسمية (بدون فوايد) ---------- */
  export interface Loan { id: string; p: number; r: number; t: number; d: number; s: string; od?: number; cr?: number; }
  export function loanRemaining(l: Loan): number { return Math.max(0, (l.p || 0) - (l.r || 0)); }
  export function loanStatus(l: Loan, now: number): "paid" | "active" | "overdue" {
    if (loanRemaining(l) === 0) return "paid";
    return now > l.d ? "overdue" : "active";
  }
  export interface LoanInfo {
    balance: number; high: number; limit: number; outstanding: number; available: number;
    usedThisMonth: number; leftThisMonth: number; overdue: boolean; restrictedUntil: number;
    canBorrow: boolean; why: string; totalBorrowed: number; totalRepaid: number;
  }
  export function loanInfo(w: Wallet | null, loans: Loan[], now: number): LoanInfo {
    const balance = w ? w.b : 0, high = w ? w.h : 0;
    const limit = Math.floor(high * LOAN_LIMIT_RATIO);
    let outstanding = 0, overdue = false, ru = 0, borrowed = 0, repaid = 0, used = 0;
    const mk = monthKey(now);
    loans.forEach(l => {
      outstanding += loanRemaining(l); borrowed += l.p || 0; repaid += l.r || 0;
      if (monthKey(l.t) === mk) used++;
      if (loanRemaining(l) > 0 && now > l.d) overdue = true;
      if (l.od || (loanRemaining(l) > 0 && now > l.d)) ru = Math.max(ru, l.d + OVERDUE_BAN_DAYS * DAY);
    });
    const available = Math.max(0, limit - outstanding);
    const left = Math.max(0, LOANS_PER_MONTH - used);
    let why = "";
    if (overdue) why = "You have an overdue loan. Repay it first";
    else if (ru > now) why = "New loans are paused until " + new Date(ru).toLocaleDateString("en-GB");
    else if (left <= 0) why = "You used both loans of this month";
    else if (available < MIN_LOAN) why = "No loan room left (limit is 50% of your all-time high)";
    return { balance, high, limit, outstanding, available, usedThisMonth: used, leftThisMonth: left, overdue, restrictedUntil: ru, canBorrow: !why, why, totalBorrowed: borrowed, totalRepaid: repaid };
  }
  export function canTakeLoan(info: LoanInfo, amount: number): string {
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount < MIN_LOAN) return "Enter a whole amount of at least " + MIN_LOAN;
    if (!info.canBorrow) return info.why;
    if (amount > info.available) return "Max you can borrow now is " + info.available;
    return "";
  }

  /* ---------- إنجازات البلاك جاك (سهلة التعديل: كل واحد سطر) ---------- */
  export interface BjStats {
    hands: number; wins: number; losses: number; pushes: number; bjs: number; busts: number;
    doubles: number; splits: number; surr: number; insBets: number; insWins: number;
    wagered: number; profit: number; lossTotal: number; bigWin: number; bigBet: number;
    streak: number; bestStreak: number; doubleWins: number; splitWins: number; fiveWins: number; twentyOneWins: number;
    lr: string[];
  }
  export function emptyStats(): BjStats {
    return { hands: 0, wins: 0, losses: 0, pushes: 0, bjs: 0, busts: 0, doubles: 0, splits: 0, surr: 0, insBets: 0, insWins: 0, wagered: 0, profit: 0, lossTotal: 0, bigWin: 0, bigBet: 0, streak: 0, bestStreak: 0, doubleWins: 0, splitWins: 0, fiveWins: 0, twentyOneWins: 0, lr: [] };
  }
  export interface Ach { id: string; n: string; d: string; reward: number; test: (s: BjStats, w: Wallet | null) => boolean; }
  export const ACHIEVEMENTS: Ach[] = [
    { id: "first_hand", n: "First Hand", d: "Complete your first Blackjack hand", reward: 100, test: s => s.hands >= 1 },
    { id: "first_blackjack", n: "First Blackjack", d: "Get your first natural Blackjack", reward: 250, test: s => s.bjs >= 1 },
    { id: "ten_wins", n: "Ten Wins", d: "Win 10 Blackjack hands", reward: 500, test: s => s.wins >= 10 },
    { id: "twentyfive_wins", n: "Twenty-Five Wins", d: "Win 25 Blackjack hands", reward: 1000, test: s => s.wins >= 25 },
    { id: "fifty_hands", n: "Fifty Hands", d: "Complete 50 Blackjack hands", reward: 1000, test: s => s.hands >= 50 },
    { id: "first_double", n: "First Double", d: "Use Double Down for the first time", reward: 100, test: s => s.doubles >= 1 },
    { id: "double_success", n: "Double Success", d: "Win a hand after Double Down", reward: 250, test: s => s.doubleWins >= 1 },
    { id: "first_split", n: "First Split", d: "Use Split for the first time", reward: 100, test: s => s.splits >= 1 },
    { id: "split_victory", n: "Split Victory", d: "Win a hand created by Split", reward: 250, test: s => s.splitWins >= 1 },
    { id: "insured", n: "Insured", d: "Win an Insurance bet", reward: 300, test: s => s.insWins >= 1 },
    { id: "five_card_win", n: "Five-Card Win", d: "Win with exactly 5 cards without busting", reward: 500, test: s => s.fiveWins >= 1 },
    { id: "perfect_21", n: "Perfect Twenty-One", d: "Win with a non-Blackjack 21", reward: 250, test: s => s.twentyOneWins >= 1 },
    { id: "ten_streak", n: "Ten-Win Streak", d: "Win 10 hands in a row", reward: 1500, test: s => s.bestStreak >= 10 },
    { id: "big_bankroll", n: "Big Bankroll", d: "Reach 100,000 Shankalolo", reward: 2000, test: (s, w) => !!w && w.h >= 100000 },
    { id: "millionaire", n: "Millionaire", d: "Reach 1,000,000 Shankalolo", reward: 5000, test: (s, w) => !!w && w.h >= 1000000 }
  ];

  /* بتضيف نتيجة جولة لاعب واحد على الإحصائيات (بتتنفذ مرة واحدة لكل جولة حسب roundKey) */
  export function applyRoundToStats(cur: BjStats | null | undefined, roundKey: string, seat: any): { s: BjStats; applied: boolean } {
    const s: BjStats = Object.assign(emptyStats(), cur || {});
    s.lr = (s.lr || []).slice();
    if (s.lr.indexOf(roundKey) >= 0) return { s: s, applied: false };
    s.lr.push(roundKey); if (s.lr.length > 30) s.lr = s.lr.slice(-30);
    (seat.hands || []).forEach((h: any) => {
      s.hands++; s.wagered += h.bet; if (h.bet > s.bigBet) s.bigBet = h.bet;
      if (h.natural) s.bjs++;
      if (h.bust) s.busts++;
      if (h.doubled) { s.doubles++; if (h.net > 0) s.doubleWins++; }
      if (h.fromSplit && h.net > 0) s.splitWins++;
      if (h.outcome === "surrender") s.surr++;
      if (h.net > 0) { s.profit += h.net; if (h.net > s.bigWin) s.bigWin = h.net; } else if (h.net < 0) s.lossTotal += -h.net;
      if (h.outcome === "win" || h.outcome === "blackjack") {
        s.wins++; s.streak++; if (s.streak > s.bestStreak) s.bestStreak = s.streak;
        if (h.cards && h.cards.length === 5 && !h.bust) s.fiveWins++;
        if (h.total === 21 && !h.natural) s.twentyOneWins++;
      } else if (h.outcome === "loss" || h.outcome === "surrender") { s.losses++; s.streak = 0; }
      else if (h.outcome === "push") s.pushes++;
    });
    if (seat.hands && seat.hands.length > 1) s.splits += seat.hands.length - 1;
    const ins = seat.ins;
    if (ins && ins.amount > 0) {
      s.insBets++; s.wagered += ins.amount;
      if (ins.won) { s.insWins++; s.profit += ins.ret - ins.amount; } else s.lossTotal += ins.amount;
    }
    return { s: s, applied: true };
  }
  export function newlyEarned(s: BjStats, w: Wallet | null, have: { [id: string]: number }): Ach[] {
    return ACHIEVEMENTS.filter(a => !have[a.id] && a.test(s, w));
  }

  /* =========================================================
     الجزء المتصل بـ Firebase
  ========================================================= */
  let db: any = null, uid = "", uname = "", wref: any = null;
  let W: Wallet | null = null;
  const listeners: Array<() => void> = [];
  let readyP: Promise<void> | null = null;

  function say(m: string): void { try { (window as any).toast && (window as any).toast(m); } catch (e) { } }
  /* Transaction آمنة: بنفتح listener لحظيًا عشان أول قيمة يشوفها الـ Transaction تكون الحقيقية
     (من غير كده Firebase بيجرب بـ null أولًا، وأي "إلغاء" على أساس null بيلغي العملية كلها غلط) */
  function safeTx(ref: any, fn: (c: any) => any): Promise<{ committed: boolean; snapshot: any; err?: any }> {
    return new Promise(resolve => {
      let started = false;
      const l = ref.on("value", () => {
        if (started) return; started = true;
        ref.transaction(fn, (err: any, committed: boolean, snap: any) => {
          try { ref.off("value", l); } catch (e) { }
          resolve({ committed: !!committed, snapshot: snap, err: err });
        }, false);
      }, () => { if (!started) { started = true; resolve({ committed: false, snapshot: null, err: "db" }); } });
    });
  }
  export function onChange(fn: () => void): void { listeners.push(fn); }
  function fire(): void { listeners.slice().forEach(f => { try { f(); } catch (e) { } }); }
  export function wallet(): Wallet | null { return W; }
  export function balance(): number { return W ? W.b : 0; }
  export function high(): number { return W ? W.h : 0; }
  export function user(): { uid: string; name: string } { return { uid: uid, name: uname }; }
  export function ready(): Promise<void> { return readyP || Promise.resolve(); }

  /* بيتنادى بعد تسجيل الدخول (من auth.js). آمن لو اتنادى أكتر من مرة. */
  export function attach(database: any, u: { uid: string; displayName?: string }): Promise<void> {
    if (!u) { detach(); return Promise.resolve(); }
    if (uid === u.uid && readyP) return readyP;
    detach();
    db = database; uid = u.uid; uname = u.displayName || "Player";
    wref = db.ref("users/" + uid + "/wallet");
    readyP = new Promise<void>(resolve => {
      let first = true;
      wref.on("value", (s: any) => {
        W = s.val() || null; fire();
        if (first) { first = false; ensure().then(() => convertPoints()).then(() => { claimInbox(); refreshLoans(); flushPending(); resolve(); }, () => resolve()); }
      }, () => { if (first) { first = false; resolve(); } });
    });
    db.ref("inbox/" + uid).on("child_added", () => { claimInbox(); });
    return readyP;
  }
  export function detach(): void {
    try { if (wref) wref.off(); if (db && uid) db.ref("inbox/" + uid).off(); } catch (e) { }
    db = null; uid = ""; uname = ""; wref = null; W = null; readyP = null; fire();
  }

  export interface TxResult { ok: boolean; dup?: boolean; err?: string; bal?: number; }
  /* الدالة الوحيدة اللي بتغيّر الرصيد */
  export function applyTx(tx: TxIn & { meta?: any }): Promise<TxResult> {
    return new Promise(resolve => {
      if (!db || !uid) { resolve({ ok: false, err: "not signed in" }); return; }
      if (typeof tx.delta !== "number" || Math.floor(tx.delta) !== tx.delta) { resolve({ ok: false, err: "bad amount" }); return; }
      let last: Reduced | null = null;
      const now = Date.now();
      safeTx(wref, (cur: any) => {
        last = reduce(cur, tx, now);
        if (last.status === "dup") return undefined;
        if (last.status === "insufficient") return last.created ? last.w : undefined;
        return last.w;
      }).then(res => {
        if (res.err) { resolve({ ok: false, err: "db" }); return; }
        const st = last ? last.status : "ok", committed = res.committed;
        if (st === "dup") { resolve({ ok: true, dup: true }); return; }
        if (last && last.created && committed) logTx(safeKey("start"), START_BALANCE, "starting_balance", START_BALANCE);
        if (st === "insufficient") { resolve({ ok: false, err: "insufficient" }); return; }
        if (!committed) { resolve({ ok: false, err: "aborted" }); return; }
        const v = res.snapshot && res.snapshot.val();
        const b = v ? v.b : 0;
        if (tx.delta !== 0 || tx.reason) logTx(tx.id ? safeKey(tx.id) : "", tx.delta, tx.reason || "adjustment", b);
        resolve({ ok: true, bal: b });
      });
    });
  }
  function logTx(id: string, a: number, r: string, b: number): void {
    try {
      const ref = id ? db.ref("users/" + uid + "/wtx/" + id) : db.ref("users/" + uid + "/wtx").push();
      ref.set({ t: Date.now(), a: a, r: r, b: b });
    } catch (e) { }
  }
  /* أول لمسة للمحفظة = المنحة الابتدائية مرة واحدة (بتتخزن في السيرفر، فالـ refresh أو مسح المتصفح ما يكرروهاش) */
  export function ensure(): Promise<void> {
    if (W && W.i) return Promise.resolve();
    return applyTx({ delta: 0 }).then(() => undefined);
  }
  export function add(amount: number, reason: string, id?: string): Promise<TxResult> {
    if (!(amount > 0) || Math.floor(amount) !== amount) return Promise.resolve({ ok: false, err: "bad amount" });
    return applyTx({ id: id, delta: amount, reason: reason });
  }
  export function remove(amount: number, reason: string, id?: string): Promise<TxResult> {
    if (!(amount > 0) || Math.floor(amount) !== amount) return Promise.resolve({ ok: false, err: "bad amount" });
    return applyTx({ id: id, delta: -amount, reason: reason });
  }
  /* تحويل لاعب لاعب: بيخصم من الراسل، والمستلم بيستلم من صندوق الوارد (مرة واحدة بالـ id) */
  export function transfer(toUid: string, amount: number, reasonOut: string, reasonIn: string, id: string, extra?: any): Promise<TxResult> {
    if (!toUid || toUid === uid) return Promise.resolve({ ok: false, err: "bad target" });
    return remove(amount, reasonOut, "out_" + id).then(r => {
      if (!r.ok && !r.dup) return r;
      return sendInbox(toUid, id, amount, reasonIn, extra).then(() => ({ ok: true }));
    });
  }
  export function sendInbox(toUid: string, key: string, amount: number, reason: string, extra?: any): Promise<void> {
    const item = Object.assign({ a: amount, r: reason, f: uid, t: Date.now() }, extra || {});
    return db.ref("inbox/" + toUid + "/" + safeKey(key)).set(item);
  }
  let claiming = false, again = false;
  export function claimInbox(): Promise<void> {
    if (!db || !uid) return Promise.resolve();
    if (claiming) { again = true; return Promise.resolve(); }
    claiming = true;
    return db.ref("inbox/" + uid).once("value").then((s: any) => {
      const items = s.val() || {};
      return Object.keys(items).reduce((p: Promise<void>, k: string) => p.then(() => claimOne(k, items[k])), Promise.resolve());
    }).catch(() => { }).then(() => { claiming = false; if (again) { again = false; claimInbox(); } });
  }
  function claimOne(k: string, it: any): Promise<void> {
    if (!it || typeof it.a !== "number" || it.a < 0 || it.a > MAX_CLAIM || Math.floor(it.a) !== it.a) return Promise.resolve();
    const isBj = k.indexOf("bj_") === 0;
    const open = isBj ? db.ref("users/" + uid + "/bj/open/" + k.slice(3)).once("value").then((x: any) => x.val()) : Promise.resolve(null);
    return open.then((o: any) => {
      let amt = it.a;
      // لو اللاعب دفع أكتر من اللي اتسجّل عليه (حركة اترفضت) بنرجّع الفرق
      if (isBj && o && typeof it.s === "number" && o.a > it.s) amt += o.a - it.s;
      return applyTx({ id: "in_" + k, delta: amt, reason: it.r || "transfer_in" }).then(r => {
        if (!r.ok && !r.dup) return;
        const rm: Promise<any>[] = [db.ref("inbox/" + uid + "/" + k).remove()];
        if (isBj) rm.push(db.ref("users/" + uid + "/bj/open/" + k.slice(3)).remove());
        return Promise.all(rm).then(() => undefined);
      });
    }).catch(() => { });
  }

  /* ---------- النقاط ← شنكلولو (1 نقطة = 10) ---------- */
  /* بتتنادى لحظة ما اللاعب بياخد نقاط جديدة بس (مش على إجمالي النقاط القديم). refId بيمنع التكرار. */
  export function convertPoints(): Promise<any> {
    if (!db || !uid) return Promise.resolve();
    return db.ref("users/" + uid + "/stats").once("value").then((s: any) => {
      const st = s.val() || {};
      let pts = 0;
      Object.keys(st).forEach(k => { pts += Math.max(0, Math.floor((st[k] && st[k].pts) || 0)); });
      const amt = pts * POINT_RATE;
      return applyTx(amt > 0 ? { id: "conv30", delta: amt, reason: "points_conversion" } : { id: "conv30", delta: 0 });
    }).catch(() => { });
  }

  export function points(pts: number, refId: string): Promise<TxResult> {
    const amount = pointsToShk(pts);
    if (!(amount > 0)) return Promise.resolve({ ok: true });
    if (db && uid) return applyTx({ id: "pts_" + refId, delta: amount, reason: "points_reward" });
    // لسه المحفظة ماجهزتش: نسجّل المكافأة محليًا وتتنفذ أول ما المحفظة تجهز (مرة واحدة بالـ id)
    const who = (typeof window !== "undefined" && (window as any).ppUser) ? (window as any).ppUser.uid : "";
    const a = pendRead(); if (!a.some((x: any) => x.id === refId)) a.push({ id: refId, a: amount, u: who }); pendWrite(a);
    return Promise.resolve({ ok: true });
  }
  const PEND = "pp_shk_pend";
  function pendRead(): any[] { try { return JSON.parse(localStorage.getItem(PEND) || "[]"); } catch (e) { return []; } }
  function pendWrite(a: any[]): void { try { localStorage.setItem(PEND, JSON.stringify(a)); } catch (e) { } }
  export function flushPending(): Promise<void> {
    if (!db || !uid) return Promise.resolve();
    const mine = pendRead().filter((x: any) => !x.u || x.u === uid);
    return mine.reduce((p: Promise<void>, x: any) => p.then(() =>
      applyTx({ id: "pts_" + x.id, delta: x.a, reason: "points_reward" }).then(r => {
        if (r.ok || r.dup) pendWrite(pendRead().filter((y: any) => y.id !== x.id));
      })), Promise.resolve());
  }

  /* ---------- السجل ---------- */
  export function history(limit?: number): Promise<any[]> {
    if (!db) return Promise.resolve([]);
    return db.ref("users/" + uid + "/wtx").orderByChild("t").limitToLast(limit || 30).once("value").then((s: any) => {
      const v = s.val() || {};
      return Object.keys(v).map(k => v[k]).sort((a: any, b: any) => b.t - a.t);
    }).catch(() => []);
  }

  /* ---------- قروض رسمية ---------- */
  export function listLoans(): Promise<Loan[]> {
    return db.ref("users/" + uid + "/loans").once("value").then((s: any) => {
      const v = s.val() || {};
      return Object.keys(v).map(k => Object.assign({ id: k }, v[k]) as Loan).sort((a, b) => b.t - a.t);
    });
  }
  /* بتعلّم القروض المتأخرة (بدون فوايد، والدين بيفضل زي ما هو) وبتكمّل أي قرض اتسجّل ومااتحسبش */
  export function refreshLoans(): Promise<void> {
    if (!db || !uid) return Promise.resolve();
    return listLoans().then(ls => Promise.all(ls.map(l => {
      const jobs: Promise<any>[] = [];
      if (!l.cr) jobs.push(applyTx({ id: "loan_" + l.id, delta: l.p, reason: "loan_received" }).then(r => { if (r.ok || r.dup) return db.ref("users/" + uid + "/loans/" + l.id + "/cr").set(1); }));
      if (loanRemaining(l) > 0 && Date.now() > l.d && l.s !== "o") jobs.push(db.ref("users/" + uid + "/loans/" + l.id).update({ s: "o", od: 1 }));
      return Promise.all(jobs);
    }))).then(() => undefined).catch(() => undefined);
  }
  export function myLoanInfo(): Promise<{ info: LoanInfo; loans: Loan[] }> {
    return refreshLoans().then(listLoans).then(ls => ({ info: loanInfo(W, ls, Date.now()), loans: ls }));
  }
  export function takeLoan(amount: number): Promise<{ ok: boolean; err?: string }> {
    return myLoanInfo().then(o => {
      const e = canTakeLoan(o.info, amount);
      if (e) return { ok: false, err: e };
      const now = Date.now(), ref = db.ref("users/" + uid + "/loans").push();
      const loan = { p: amount, r: 0, t: now, d: now + LOAN_TERM_DAYS * DAY, s: "a", cr: 0 };
      return ref.set(loan).then(() => applyTx({ id: "loan_" + ref.key, delta: amount, reason: "loan_received" })).then((r: TxResult) => {
        if (!r.ok && !r.dup) return { ok: false, err: "Could not add the loan" };
        return ref.child("cr").set(1).then(() => ({ ok: true }));
      });
    }).catch(() => ({ ok: false, err: "Something went wrong" }));
  }
  export function repayLoan(id: string, amount: number): Promise<{ ok: boolean; err?: string }> {
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0) return Promise.resolve({ ok: false, err: "Enter a whole amount" });
    const lref = db.ref("users/" + uid + "/loans/" + id);
    return lref.once("value").then((s: any) => {
      const l = s.val();
      if (!l) return { ok: false, err: "Loan not found" };
      const rem = loanRemaining(l);
      if (rem <= 0) return { ok: false, err: "Already paid" };
      if (amount > rem) return { ok: false, err: "Only " + rem + " is left on this loan" };
      const txid = "lrep_" + id + "_" + Date.now();
      return remove(amount, "loan_repaid", txid).then((r): any => {
        if (!r.ok) return { ok: false, err: r.err === "insufficient" ? "Not enough Shankalolo" : "Could not repay" };
        return safeTx(lref, (c: any) => {
          if (!c) return c;
          c.ps = c.ps || {}; if (c.ps[txid]) return undefined;
          if (Date.now() > c.d) c.od = 1;                 // سداد متأخر: الإيقاف 7 أيام من تاريخ الاستحقاق يفضل ساري
          c.ps[txid] = amount; c.r = (c.r || 0) + amount;
          c.s = c.r >= c.p ? "p" : (Date.now() > c.d ? "o" : c.s);
          return c;
        }).then(() => ({ ok: true }));
      });
    }).catch(() => ({ ok: false, err: "Something went wrong" }));
  }

  /* ---------- قروض الأصدقاء ---------- */
  export interface FLoan { id: string; l: string; ln: string; b: string; bn: string; p: number; r: number; st: string; t: number; ta?: number; reps?: any; }
  export function floanRemaining(f: FLoan): number { return Math.max(0, f.p - (f.r || 0)); }
  export function canRequestFriendLoan(amount: number): string {
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0) return "Enter a whole amount";
    if (amount > FRIEND_LOAN_MAX) return "Max per friend loan is " + FRIEND_LOAN_MAX;
    return "";
  }
  export function friendLoanRequest(lenderUid: string, lenderName: string, amount: number): Promise<{ ok: boolean; err?: string }> {
    const e = canRequestFriendLoan(amount);
    if (e) return Promise.resolve({ ok: false, err: e });
    if (!lenderUid || lenderUid === uid) return Promise.resolve({ ok: false, err: "Pick a friend" });
    const ref = db.ref("floans").push(), id = ref.key;
    const rec = { l: lenderUid, ln: lenderName || "Friend", b: uid, bn: uname, p: amount, r: 0, st: "req", t: Date.now() };
    // الطلب مجرد طلب: مفيش أي فلوس بتتحرك لحد ما الصاحب يوافق
    return ref.set(rec).then(() => {
      const up: any = {}; up["fli/" + uid + "/" + id] = "b"; up["fli/" + lenderUid + "/" + id] = "l";
      return db.ref().update(up);
    }).then(() => ({ ok: true })).catch(() => ({ ok: false, err: "Could not send the request" }));
  }
  export function listFriendLoans(): Promise<FLoan[]> {
    return db.ref("fli/" + uid).once("value").then((s: any) => {
      const ids = Object.keys(s.val() || {});
      return Promise.all(ids.map(id => db.ref("floans/" + id).once("value").then((x: any) => x.val() ? Object.assign({ id: id }, x.val()) : null)));
    }).then((a: any[]) => a.filter(Boolean).sort((x: FLoan, y: FLoan) => y.t - x.t));
  }
  export function friendLoanApprove(id: string): Promise<{ ok: boolean; err?: string }> {
    const fref = db.ref("floans/" + id);
    let rec: any = null;
    return safeTx(fref, (c: any) => { if (!c || c.l !== uid || c.st !== "req") return undefined; rec = c; return Object.assign({}, c, { st: "pay" }); }).then((r: any) => {
      if (!r.committed || !rec) return { ok: false, err: "This request is not available" };
      if (rec.p > FRIEND_LOAN_MAX) return fref.update({ st: "rej" }).then(() => ({ ok: false, err: "Amount is above the limit" }));
      return remove(rec.p, "friend_loan_sent", "fl_out_" + id).then(t => {
        if (!t.ok && !t.dup) return fref.update({ st: "req" }).then(() => ({ ok: false, err: t.err === "insufficient" ? "You do not have enough Shankalolo" : "Could not send" }));
        return sendInbox(rec.b, "fl_in_" + id, rec.p, "friend_loan_received", { fl: id })
          .then(() => fref.update({ st: "act", ta: Date.now() })).then(() => ({ ok: true }));
      });
    }).catch(() => ({ ok: false, err: "Something went wrong" }));
  }
  export function friendLoanReject(id: string): Promise<boolean> {
    return safeTx(db.ref("floans/" + id), (c: any) => (c && c.l === uid && c.st === "req") ? Object.assign({}, c, { st: "rej" }) : undefined).then((r: any) => !!r.committed).catch(() => false);
  }
  export function friendLoanCancel(id: string): Promise<boolean> {
    return safeTx(db.ref("floans/" + id), (c: any) => (c && c.b === uid && c.st === "req") ? Object.assign({}, c, { st: "can" }) : undefined).then((r: any) => !!r.committed).catch(() => false);
  }
  export function friendLoanRepay(id: string, amount: number): Promise<{ ok: boolean; err?: string }> {
    if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0) return Promise.resolve({ ok: false, err: "Enter a whole amount" });
    const fref = db.ref("floans/" + id);
    return fref.once("value").then((s: any) => {
      const f = s.val();
      if (!f || f.b !== uid || f.st !== "act") return { ok: false, err: "This loan is not active" };
      const rem = floanRemaining(f);
      if (amount > rem) return { ok: false, err: "Only " + rem + " is left" };
      const txid = "flrep_" + id + "_" + Date.now();
      return remove(amount, "friend_loan_repaid", txid).then((t): any => {
        if (!t.ok) return { ok: false, err: t.err === "insufficient" ? "Not enough Shankalolo" : "Could not repay" };
        return safeTx(fref, (c: any) => {
          if (!c) return c;
          c.reps = c.reps || {}; if (c.reps[txid]) return undefined;
          c.reps[txid] = { a: amount, t: Date.now() }; c.r = (c.r || 0) + amount;
          if (c.r >= c.p) c.st = "paid";
          return c;
        }).then(() => sendInbox(f.l, "flr_" + txid, amount, "friend_loan_received_back", { fl: id })).then(() => ({ ok: true }));
      });
    }).catch(() => ({ ok: false, err: "Something went wrong" }));
  }

  /* ---------- البلاك جاك (أونلاين بس: شنكلولو حقيقية) ---------- */
  /* الرهان بيتخصم لحظة الوضع، والعوائد بتيجي من الطاولة عن طريق صندوق الوارد */
  export function bjStake(roomCode: string, roundId: string, n: number, amount: number): Promise<TxResult> {
    const key = safeKey(roomCode + "_" + roundId);
    return remove(amount, "blackjack_bet", "bet_" + key + "_" + n).then(r => {
      if (!r.ok && !r.dup) return r;
      // علامة "رهان مفتوح": كل رقم رهان ليه خانة، فتكرار نفس الرهان مايتحسبش مرتين
      return safeTx(db.ref("users/" + uid + "/bj/open/" + key), (c: any) => {
        c = c || { a: 0, c: roomCode, r: roundId, t: Date.now(), ns: {} };
        c.ns = c.ns || {}; c.ns[n] = amount;
        let sum = 0; Object.keys(c.ns).forEach(k => { sum += c.ns[k]; });
        c.a = sum; return c;
      }).then(() => r);
    });
  }
  export function bjNextN(roomCode: string, roundId: string): Promise<number> {
    const key = safeKey(roomCode + "_" + roundId);
    return db.ref("users/" + uid + "/bj/open/" + key + "/ns").once("value").then((s: any) => {
      const v = s.val() || {}; let m = -1; Object.keys(v).forEach(k => { if (+k > m) m = +k; }); return m + 1;
    }).catch(() => 1);
  }
  /* لو الطاولة اتقفلت قبل ما الجولة تتحسم: بنرجّع الرهانات المعلّقة مرة واحدة */
  export function recoverOpenBets(roomExistsFn: (code: string, round: string) => Promise<boolean>): Promise<void> {
    if (!db || !uid) return Promise.resolve();
    return db.ref("users/" + uid + "/bj/open").once("value").then((s: any) => {
      const v = s.val() || {};
      return Promise.all(Object.keys(v).map(k => {
        const o = v[k];
        if (Date.now() - (o.t || 0) < 120000) return;
        return db.ref("inbox/" + uid + "/bj_" + k).once("value").then((ib: any) => {
          if (ib.exists()) return;
          if (W && W.ap && W.ap[safeKey("in_bj_" + k)]) return db.ref("users/" + uid + "/bj/open/" + k).remove();
          return roomExistsFn(o.c, o.r).then(live => {
            if (live) return;
            return applyTx({ id: "refund_" + k, delta: o.a, reason: "blackjack_refund" }).then(r => { if (r.ok || r.dup) return db.ref("users/" + uid + "/bj/open/" + k).remove(); });
          });
        });
      }));
    }).then(() => undefined).catch(() => undefined);
  }
  export function bjStats(): Promise<BjStats> {
    return db.ref("users/" + uid + "/bj/stats").once("value").then((s: any) => Object.assign(emptyStats(), s.val() || {}));
  }
  export function bjAchievements(): Promise<{ [id: string]: number }> {
    return db.ref("users/" + uid + "/bj/ach").once("value").then((s: any) => s.val() || {});
  }
  /* بتسجّل نتيجة جولة (إحصائيات + إنجازات + مكافآتها). آمنة لو اتنادت مرتين. */
  export function recordBjRound(roundKey: string, seat: any): Promise<Ach[]> {
    const key = safeKey(roundKey);
    let applied = false, out: BjStats | null = null;
    return safeTx(db.ref("users/" + uid + "/bj/stats"), (cur: any) => {
      const r = applyRoundToStats(cur, key, seat); applied = r.applied; out = r.s;
      return r.applied ? r.s : undefined;
    }).then(() => (out && applied ? checkAchievements(out) : []));
  }
  export function checkAchievements(s?: BjStats): Promise<Ach[]> {
    const run = (st: BjStats) => bjAchievements().then(have => {
      const earned = newlyEarned(st, W, have);
      return earned.reduce((p: Promise<Ach[]>, a: Ach) => p.then(list =>
        applyTx({ id: "ach_" + a.id, delta: a.reward, reason: "blackjack_achievement" }).then(r => {
          if (!r.ok && !r.dup) return list;
          return db.ref("users/" + uid + "/bj/ach/" + a.id).set(Date.now()).then(() => { list.push(a); return list; });
        })), Promise.resolve([] as Ach[]));
    });
    return (s ? Promise.resolve(s) : bjStats()).then(run);
  }
}
