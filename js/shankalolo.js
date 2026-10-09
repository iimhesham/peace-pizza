"use strict";
var SHK;
(function (SHK) {
    SHK.START_BALANCE = 10000;
    SHK.POINT_RATE = 10;
    SHK.LOAN_LIMIT_RATIO = 0.5;
    SHK.LOANS_PER_MONTH = 2;
    SHK.LOAN_TERM_DAYS = 30;
    SHK.OVERDUE_BAN_DAYS = 7;
    SHK.FRIEND_LOAN_MAX = 50000;
    SHK.MIN_LOAN = 10;
    const DAY = 86400000;
    const MAX_CLAIM = 100000;
    function safeKey(s) { return String(s).replace(/[.#$\[\]\/\s]/g, "_"); }
    SHK.safeKey = safeKey;
    function pointsToShk(points) { return Math.max(0, Math.floor(points)) * SHK.POINT_RATE; }
    SHK.pointsToShk = pointsToShk;
    function monthKey(ts) {
        const d = new Date(ts);
        return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2);
    }
    SHK.monthKey = monthKey;
    function newWallet(now) {
        return { i: 1, b: SHK.START_BALANCE, h: SHK.START_BALANCE, ap: { start: now }, t0: now };
    }
    SHK.newWallet = newWallet;
    function reduce(cur, tx, now) {
        let created = false, w;
        if (!cur || !cur.i) {
            w = newWallet(now);
            created = true;
        }
        else
            w = { i: 1, b: cur.b || 0, h: cur.h || 0, ap: Object.assign({}, cur.ap || {}), t0: cur.t0 || now };
        const id = tx.id ? safeKey(tx.id) : "";
        if (id && w.ap[id])
            return { w: w, status: "dup", created: created };
        const nb = w.b + tx.delta;
        if (!(nb >= 0) || Math.floor(nb) !== nb)
            return { w: w, status: "insufficient", created: created };
        w.b = nb;
        if (nb > w.h)
            w.h = nb;
        if (id)
            w.ap[id] = now;
        const keys = Object.keys(w.ap);
        if (keys.length > 400) {
            keys.filter(k => k !== "start").sort((a, b) => w.ap[a] - w.ap[b]).slice(0, keys.length - 300).forEach(k => { delete w.ap[k]; });
        }
        return { w: w, status: "ok", created: created };
    }
    SHK.reduce = reduce;
    function loanRemaining(l) { return Math.max(0, (l.p || 0) - (l.r || 0)); }
    SHK.loanRemaining = loanRemaining;
    function loanStatus(l, now) {
        if (loanRemaining(l) === 0)
            return "paid";
        return now > l.d ? "overdue" : "active";
    }
    SHK.loanStatus = loanStatus;
    function loanInfo(w, loans, now) {
        const balance = w ? w.b : 0, high = w ? w.h : 0;
        const limit = Math.floor(high * SHK.LOAN_LIMIT_RATIO);
        let outstanding = 0, overdue = false, ru = 0, borrowed = 0, repaid = 0, used = 0;
        const mk = monthKey(now);
        loans.forEach(l => {
            outstanding += loanRemaining(l);
            borrowed += l.p || 0;
            repaid += l.r || 0;
            if (monthKey(l.t) === mk)
                used++;
            if (loanRemaining(l) > 0 && now > l.d)
                overdue = true;
            if (l.od || (loanRemaining(l) > 0 && now > l.d))
                ru = Math.max(ru, l.d + SHK.OVERDUE_BAN_DAYS * DAY);
        });
        const available = Math.max(0, limit - outstanding);
        const left = Math.max(0, SHK.LOANS_PER_MONTH - used);
        let why = "";
        if (overdue)
            why = "You have an overdue loan. Repay it first";
        else if (ru > now)
            why = "New loans are paused until " + new Date(ru).toLocaleDateString("en-GB");
        else if (left <= 0)
            why = "You used both loans of this month";
        else if (available < SHK.MIN_LOAN)
            why = "No loan room left (limit is 50% of your all-time high)";
        return { balance, high, limit, outstanding, available, usedThisMonth: used, leftThisMonth: left, overdue, restrictedUntil: ru, canBorrow: !why, why, totalBorrowed: borrowed, totalRepaid: repaid };
    }
    SHK.loanInfo = loanInfo;
    function canTakeLoan(info, amount) {
        if (typeof amount !== "number" || Math.floor(amount) !== amount || amount < SHK.MIN_LOAN)
            return "Enter a whole amount of at least " + SHK.MIN_LOAN;
        if (!info.canBorrow)
            return info.why;
        if (amount > info.available)
            return "Max you can borrow now is " + info.available;
        return "";
    }
    SHK.canTakeLoan = canTakeLoan;
    function emptyStats() {
        return { hands: 0, wins: 0, losses: 0, pushes: 0, bjs: 0, busts: 0, doubles: 0, splits: 0, surr: 0, insBets: 0, insWins: 0, wagered: 0, profit: 0, lossTotal: 0, bigWin: 0, bigBet: 0, streak: 0, bestStreak: 0, doubleWins: 0, splitWins: 0, fiveWins: 0, twentyOneWins: 0, lr: [] };
    }
    SHK.emptyStats = emptyStats;
    SHK.ACHIEVEMENTS = [
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
    function applyRoundToStats(cur, roundKey, seat) {
        const s = Object.assign(emptyStats(), cur || {});
        s.lr = (s.lr || []).slice();
        if (s.lr.indexOf(roundKey) >= 0)
            return { s: s, applied: false };
        s.lr.push(roundKey);
        if (s.lr.length > 30)
            s.lr = s.lr.slice(-30);
        (seat.hands || []).forEach((h) => {
            s.hands++;
            s.wagered += h.bet;
            if (h.bet > s.bigBet)
                s.bigBet = h.bet;
            if (h.natural)
                s.bjs++;
            if (h.bust)
                s.busts++;
            if (h.doubled) {
                s.doubles++;
                if (h.net > 0)
                    s.doubleWins++;
            }
            if (h.fromSplit && h.net > 0)
                s.splitWins++;
            if (h.outcome === "surrender")
                s.surr++;
            if (h.net > 0) {
                s.profit += h.net;
                if (h.net > s.bigWin)
                    s.bigWin = h.net;
            }
            else if (h.net < 0)
                s.lossTotal += -h.net;
            if (h.outcome === "win" || h.outcome === "blackjack") {
                s.wins++;
                s.streak++;
                if (s.streak > s.bestStreak)
                    s.bestStreak = s.streak;
                if (h.cards && h.cards.length === 5 && !h.bust)
                    s.fiveWins++;
                if (h.total === 21 && !h.natural)
                    s.twentyOneWins++;
            }
            else if (h.outcome === "loss" || h.outcome === "surrender") {
                s.losses++;
                s.streak = 0;
            }
            else if (h.outcome === "push")
                s.pushes++;
        });
        if (seat.hands && seat.hands.length > 1)
            s.splits += seat.hands.length - 1;
        const ins = seat.ins;
        if (ins && ins.amount > 0) {
            s.insBets++;
            s.wagered += ins.amount;
            if (ins.won) {
                s.insWins++;
                s.profit += ins.ret - ins.amount;
            }
            else
                s.lossTotal += ins.amount;
        }
        return { s: s, applied: true };
    }
    SHK.applyRoundToStats = applyRoundToStats;
    function newlyEarned(s, w, have) {
        return SHK.ACHIEVEMENTS.filter(a => !have[a.id] && a.test(s, w));
    }
    SHK.newlyEarned = newlyEarned;
    let db = null, uid = "", uname = "", wref = null;
    let W = null;
    const listeners = [];
    let readyP = null;
    function say(m) { try {
        window.toast && window.toast(m);
    }
    catch (e) { } }
    function safeTx(ref, fn) {
        return new Promise(resolve => {
            let started = false;
            const l = ref.on("value", () => {
                if (started)
                    return;
                started = true;
                ref.transaction(fn, (err, committed, snap) => {
                    try {
                        ref.off("value", l);
                    }
                    catch (e) { }
                    resolve({ committed: !!committed, snapshot: snap, err: err });
                }, false);
            }, () => { if (!started) {
                started = true;
                resolve({ committed: false, snapshot: null, err: "db" });
            } });
        });
    }
    function onChange(fn) { listeners.push(fn); }
    SHK.onChange = onChange;
    function fire() { listeners.slice().forEach(f => { try {
        f();
    }
    catch (e) { } }); }
    function wallet() { return W; }
    SHK.wallet = wallet;
    function balance() { return W ? W.b : 0; }
    SHK.balance = balance;
    function high() { return W ? W.h : 0; }
    SHK.high = high;
    function user() { return { uid: uid, name: uname }; }
    SHK.user = user;
    function ready() { return readyP || Promise.resolve(); }
    SHK.ready = ready;
    function attach(database, u) {
        if (!u) {
            detach();
            return Promise.resolve();
        }
        if (uid === u.uid && readyP)
            return readyP;
        detach();
        db = database;
        uid = u.uid;
        uname = u.displayName || "Player";
        wref = db.ref("users/" + uid + "/wallet");
        readyP = new Promise(resolve => {
            let first = true;
            wref.on("value", (s) => {
                W = s.val() || null;
                fire();
                if (first) {
                    first = false;
                    ensure().then(() => { claimInbox(); refreshLoans(); flushPending(); resolve(); }, () => resolve());
                }
            }, () => { if (first) {
                first = false;
                resolve();
            } });
        });
        db.ref("inbox/" + uid).on("child_added", () => { claimInbox(); });
        return readyP;
    }
    SHK.attach = attach;
    function detach() {
        try {
            if (wref)
                wref.off();
            if (db && uid)
                db.ref("inbox/" + uid).off();
        }
        catch (e) { }
        db = null;
        uid = "";
        uname = "";
        wref = null;
        W = null;
        readyP = null;
        fire();
    }
    SHK.detach = detach;
    function applyTx(tx) {
        return new Promise(resolve => {
            if (!db || !uid) {
                resolve({ ok: false, err: "not signed in" });
                return;
            }
            if (typeof tx.delta !== "number" || Math.floor(tx.delta) !== tx.delta) {
                resolve({ ok: false, err: "bad amount" });
                return;
            }
            let last = null;
            const now = Date.now();
            safeTx(wref, (cur) => {
                last = reduce(cur, tx, now);
                if (last.status === "dup")
                    return undefined;
                if (last.status === "insufficient")
                    return last.created ? last.w : undefined;
                return last.w;
            }).then(res => {
                if (res.err) {
                    resolve({ ok: false, err: "db" });
                    return;
                }
                const st = last ? last.status : "ok", committed = res.committed;
                if (st === "dup") {
                    resolve({ ok: true, dup: true });
                    return;
                }
                if (last && last.created && committed)
                    logTx(safeKey("start"), SHK.START_BALANCE, "starting_balance", SHK.START_BALANCE);
                if (st === "insufficient") {
                    resolve({ ok: false, err: "insufficient" });
                    return;
                }
                if (!committed) {
                    resolve({ ok: false, err: "aborted" });
                    return;
                }
                const v = res.snapshot && res.snapshot.val();
                const b = v ? v.b : 0;
                if (tx.delta !== 0 || tx.reason)
                    logTx(tx.id ? safeKey(tx.id) : "", tx.delta, tx.reason || "adjustment", b);
                resolve({ ok: true, bal: b });
            });
        });
    }
    SHK.applyTx = applyTx;
    function logTx(id, a, r, b) {
        try {
            const ref = id ? db.ref("users/" + uid + "/wtx/" + id) : db.ref("users/" + uid + "/wtx").push();
            ref.set({ t: Date.now(), a: a, r: r, b: b });
        }
        catch (e) { }
    }
    function ensure() {
        if (W && W.i)
            return Promise.resolve();
        return applyTx({ delta: 0 }).then(() => undefined);
    }
    SHK.ensure = ensure;
    function add(amount, reason, id) {
        if (!(amount > 0) || Math.floor(amount) !== amount)
            return Promise.resolve({ ok: false, err: "bad amount" });
        return applyTx({ id: id, delta: amount, reason: reason });
    }
    SHK.add = add;
    function remove(amount, reason, id) {
        if (!(amount > 0) || Math.floor(amount) !== amount)
            return Promise.resolve({ ok: false, err: "bad amount" });
        return applyTx({ id: id, delta: -amount, reason: reason });
    }
    SHK.remove = remove;
    function transfer(toUid, amount, reasonOut, reasonIn, id, extra) {
        if (!toUid || toUid === uid)
            return Promise.resolve({ ok: false, err: "bad target" });
        return remove(amount, reasonOut, "out_" + id).then(r => {
            if (!r.ok && !r.dup)
                return r;
            return sendInbox(toUid, id, amount, reasonIn, extra).then(() => ({ ok: true }));
        });
    }
    SHK.transfer = transfer;
    function sendInbox(toUid, key, amount, reason, extra) {
        const item = Object.assign({ a: amount, r: reason, f: uid, t: Date.now() }, extra || {});
        return db.ref("inbox/" + toUid + "/" + safeKey(key)).set(item);
    }
    SHK.sendInbox = sendInbox;
    let claiming = false, again = false;
    function claimInbox() {
        if (!db || !uid)
            return Promise.resolve();
        if (claiming) {
            again = true;
            return Promise.resolve();
        }
        claiming = true;
        return db.ref("inbox/" + uid).once("value").then((s) => {
            const items = s.val() || {};
            return Object.keys(items).reduce((p, k) => p.then(() => claimOne(k, items[k])), Promise.resolve());
        }).catch(() => { }).then(() => { claiming = false; if (again) {
            again = false;
            claimInbox();
        } });
    }
    SHK.claimInbox = claimInbox;
    function claimOne(k, it) {
        if (!it || typeof it.a !== "number" || it.a < 0 || it.a > MAX_CLAIM || Math.floor(it.a) !== it.a)
            return Promise.resolve();
        const isBj = k.indexOf("bj_") === 0;
        const open = isBj ? db.ref("users/" + uid + "/bj/open/" + k.slice(3)).once("value").then((x) => x.val()) : Promise.resolve(null);
        return open.then((o) => {
            let amt = it.a;
            if (isBj && o && typeof it.s === "number" && o.a > it.s)
                amt += o.a - it.s;
            return applyTx({ id: "in_" + k, delta: amt, reason: it.r || "transfer_in" }).then(r => {
                if (!r.ok && !r.dup)
                    return;
                const rm = [db.ref("inbox/" + uid + "/" + k).remove()];
                if (isBj)
                    rm.push(db.ref("users/" + uid + "/bj/open/" + k.slice(3)).remove());
                return Promise.all(rm).then(() => undefined);
            });
        }).catch(() => { });
    }
    function points(pts, refId) {
        const amount = pointsToShk(pts);
        if (!(amount > 0))
            return Promise.resolve({ ok: true });
        if (db && uid)
            return applyTx({ id: "pts_" + refId, delta: amount, reason: "points_reward" });
        const who = (typeof window !== "undefined" && window.ppUser) ? window.ppUser.uid : "";
        const a = pendRead();
        if (!a.some((x) => x.id === refId))
            a.push({ id: refId, a: amount, u: who });
        pendWrite(a);
        return Promise.resolve({ ok: true });
    }
    SHK.points = points;
    const PEND = "pp_shk_pend";
    function pendRead() { try {
        return JSON.parse(localStorage.getItem(PEND) || "[]");
    }
    catch (e) {
        return [];
    } }
    function pendWrite(a) { try {
        localStorage.setItem(PEND, JSON.stringify(a));
    }
    catch (e) { } }
    function flushPending() {
        if (!db || !uid)
            return Promise.resolve();
        const mine = pendRead().filter((x) => !x.u || x.u === uid);
        return mine.reduce((p, x) => p.then(() => applyTx({ id: "pts_" + x.id, delta: x.a, reason: "points_reward" }).then(r => {
            if (r.ok || r.dup)
                pendWrite(pendRead().filter((y) => y.id !== x.id));
        })), Promise.resolve());
    }
    SHK.flushPending = flushPending;
    function history(limit) {
        if (!db)
            return Promise.resolve([]);
        return db.ref("users/" + uid + "/wtx").orderByChild("t").limitToLast(limit || 30).once("value").then((s) => {
            const v = s.val() || {};
            return Object.keys(v).map(k => v[k]).sort((a, b) => b.t - a.t);
        }).catch(() => []);
    }
    SHK.history = history;
    function listLoans() {
        return db.ref("users/" + uid + "/loans").once("value").then((s) => {
            const v = s.val() || {};
            return Object.keys(v).map(k => Object.assign({ id: k }, v[k])).sort((a, b) => b.t - a.t);
        });
    }
    SHK.listLoans = listLoans;
    function refreshLoans() {
        if (!db || !uid)
            return Promise.resolve();
        return listLoans().then(ls => Promise.all(ls.map(l => {
            const jobs = [];
            if (!l.cr)
                jobs.push(applyTx({ id: "loan_" + l.id, delta: l.p, reason: "loan_received" }).then(r => { if (r.ok || r.dup)
                    return db.ref("users/" + uid + "/loans/" + l.id + "/cr").set(1); }));
            if (loanRemaining(l) > 0 && Date.now() > l.d && l.s !== "o")
                jobs.push(db.ref("users/" + uid + "/loans/" + l.id).update({ s: "o", od: 1 }));
            return Promise.all(jobs);
        }))).then(() => undefined).catch(() => undefined);
    }
    SHK.refreshLoans = refreshLoans;
    function myLoanInfo() {
        return refreshLoans().then(listLoans).then(ls => ({ info: loanInfo(W, ls, Date.now()), loans: ls }));
    }
    SHK.myLoanInfo = myLoanInfo;
    function takeLoan(amount) {
        return myLoanInfo().then(o => {
            const e = canTakeLoan(o.info, amount);
            if (e)
                return { ok: false, err: e };
            const now = Date.now(), ref = db.ref("users/" + uid + "/loans").push();
            const loan = { p: amount, r: 0, t: now, d: now + SHK.LOAN_TERM_DAYS * DAY, s: "a", cr: 0 };
            return ref.set(loan).then(() => applyTx({ id: "loan_" + ref.key, delta: amount, reason: "loan_received" })).then((r) => {
                if (!r.ok && !r.dup)
                    return { ok: false, err: "Could not add the loan" };
                return ref.child("cr").set(1).then(() => ({ ok: true }));
            });
        }).catch(() => ({ ok: false, err: "Something went wrong" }));
    }
    SHK.takeLoan = takeLoan;
    function repayLoan(id, amount) {
        if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0)
            return Promise.resolve({ ok: false, err: "Enter a whole amount" });
        const lref = db.ref("users/" + uid + "/loans/" + id);
        return lref.once("value").then((s) => {
            const l = s.val();
            if (!l)
                return { ok: false, err: "Loan not found" };
            const rem = loanRemaining(l);
            if (rem <= 0)
                return { ok: false, err: "Already paid" };
            if (amount > rem)
                return { ok: false, err: "Only " + rem + " is left on this loan" };
            const txid = "lrep_" + id + "_" + Date.now();
            return remove(amount, "loan_repaid", txid).then((r) => {
                if (!r.ok)
                    return { ok: false, err: r.err === "insufficient" ? "Not enough Shankalolo" : "Could not repay" };
                return safeTx(lref, (c) => {
                    if (!c)
                        return c;
                    c.ps = c.ps || {};
                    if (c.ps[txid])
                        return undefined;
                    if (Date.now() > c.d)
                        c.od = 1;
                    c.ps[txid] = amount;
                    c.r = (c.r || 0) + amount;
                    c.s = c.r >= c.p ? "p" : (Date.now() > c.d ? "o" : c.s);
                    return c;
                }).then(() => ({ ok: true }));
            });
        }).catch(() => ({ ok: false, err: "Something went wrong" }));
    }
    SHK.repayLoan = repayLoan;
    function floanRemaining(f) { return Math.max(0, f.p - (f.r || 0)); }
    SHK.floanRemaining = floanRemaining;
    function canRequestFriendLoan(amount) {
        if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0)
            return "Enter a whole amount";
        if (amount > SHK.FRIEND_LOAN_MAX)
            return "Max per friend loan is " + SHK.FRIEND_LOAN_MAX;
        return "";
    }
    SHK.canRequestFriendLoan = canRequestFriendLoan;
    function friendLoanRequest(lenderUid, lenderName, amount) {
        const e = canRequestFriendLoan(amount);
        if (e)
            return Promise.resolve({ ok: false, err: e });
        if (!lenderUid || lenderUid === uid)
            return Promise.resolve({ ok: false, err: "Pick a friend" });
        const ref = db.ref("floans").push(), id = ref.key;
        const rec = { l: lenderUid, ln: lenderName || "Friend", b: uid, bn: uname, p: amount, r: 0, st: "req", t: Date.now() };
        return ref.set(rec).then(() => {
            const up = {};
            up["fli/" + uid + "/" + id] = "b";
            up["fli/" + lenderUid + "/" + id] = "l";
            return db.ref().update(up);
        }).then(() => ({ ok: true })).catch(() => ({ ok: false, err: "Could not send the request" }));
    }
    SHK.friendLoanRequest = friendLoanRequest;
    function listFriendLoans() {
        return db.ref("fli/" + uid).once("value").then((s) => {
            const ids = Object.keys(s.val() || {});
            return Promise.all(ids.map(id => db.ref("floans/" + id).once("value").then((x) => x.val() ? Object.assign({ id: id }, x.val()) : null)));
        }).then((a) => a.filter(Boolean).sort((x, y) => y.t - x.t));
    }
    SHK.listFriendLoans = listFriendLoans;
    function friendLoanApprove(id) {
        const fref = db.ref("floans/" + id);
        let rec = null;
        return safeTx(fref, (c) => { if (!c || c.l !== uid || c.st !== "req")
            return undefined; rec = c; return Object.assign({}, c, { st: "pay" }); }).then((r) => {
            if (!r.committed || !rec)
                return { ok: false, err: "This request is not available" };
            if (rec.p > SHK.FRIEND_LOAN_MAX)
                return fref.update({ st: "rej" }).then(() => ({ ok: false, err: "Amount is above the limit" }));
            return remove(rec.p, "friend_loan_sent", "fl_out_" + id).then(t => {
                if (!t.ok && !t.dup)
                    return fref.update({ st: "req" }).then(() => ({ ok: false, err: t.err === "insufficient" ? "You do not have enough Shankalolo" : "Could not send" }));
                return sendInbox(rec.b, "fl_in_" + id, rec.p, "friend_loan_received", { fl: id })
                    .then(() => fref.update({ st: "act", ta: Date.now() })).then(() => ({ ok: true }));
            });
        }).catch(() => ({ ok: false, err: "Something went wrong" }));
    }
    SHK.friendLoanApprove = friendLoanApprove;
    function friendLoanReject(id) {
        return safeTx(db.ref("floans/" + id), (c) => (c && c.l === uid && c.st === "req") ? Object.assign({}, c, { st: "rej" }) : undefined).then((r) => !!r.committed).catch(() => false);
    }
    SHK.friendLoanReject = friendLoanReject;
    function friendLoanCancel(id) {
        return safeTx(db.ref("floans/" + id), (c) => (c && c.b === uid && c.st === "req") ? Object.assign({}, c, { st: "can" }) : undefined).then((r) => !!r.committed).catch(() => false);
    }
    SHK.friendLoanCancel = friendLoanCancel;
    function friendLoanRepay(id, amount) {
        if (typeof amount !== "number" || Math.floor(amount) !== amount || amount <= 0)
            return Promise.resolve({ ok: false, err: "Enter a whole amount" });
        const fref = db.ref("floans/" + id);
        return fref.once("value").then((s) => {
            const f = s.val();
            if (!f || f.b !== uid || f.st !== "act")
                return { ok: false, err: "This loan is not active" };
            const rem = floanRemaining(f);
            if (amount > rem)
                return { ok: false, err: "Only " + rem + " is left" };
            const txid = "flrep_" + id + "_" + Date.now();
            return remove(amount, "friend_loan_repaid", txid).then((t) => {
                if (!t.ok)
                    return { ok: false, err: t.err === "insufficient" ? "Not enough Shankalolo" : "Could not repay" };
                return safeTx(fref, (c) => {
                    if (!c)
                        return c;
                    c.reps = c.reps || {};
                    if (c.reps[txid])
                        return undefined;
                    c.reps[txid] = { a: amount, t: Date.now() };
                    c.r = (c.r || 0) + amount;
                    if (c.r >= c.p)
                        c.st = "paid";
                    return c;
                }).then(() => sendInbox(f.l, "flr_" + txid, amount, "friend_loan_received_back", { fl: id })).then(() => ({ ok: true }));
            });
        }).catch(() => ({ ok: false, err: "Something went wrong" }));
    }
    SHK.friendLoanRepay = friendLoanRepay;
    function bjStake(roomCode, roundId, n, amount) {
        const key = safeKey(roomCode + "_" + roundId);
        return remove(amount, "blackjack_bet", "bet_" + key + "_" + n).then(r => {
            if (!r.ok && !r.dup)
                return r;
            return safeTx(db.ref("users/" + uid + "/bj/open/" + key), (c) => {
                c = c || { a: 0, c: roomCode, r: roundId, t: Date.now(), ns: {} };
                c.ns = c.ns || {};
                c.ns[n] = amount;
                let sum = 0;
                Object.keys(c.ns).forEach(k => { sum += c.ns[k]; });
                c.a = sum;
                return c;
            }).then(() => r);
        });
    }
    SHK.bjStake = bjStake;
    function bjNextN(roomCode, roundId) {
        const key = safeKey(roomCode + "_" + roundId);
        return db.ref("users/" + uid + "/bj/open/" + key + "/ns").once("value").then((s) => {
            const v = s.val() || {};
            let m = -1;
            Object.keys(v).forEach(k => { if (+k > m)
                m = +k; });
            return m + 1;
        }).catch(() => 1);
    }
    SHK.bjNextN = bjNextN;
    function recoverOpenBets(roomExistsFn) {
        if (!db || !uid)
            return Promise.resolve();
        return db.ref("users/" + uid + "/bj/open").once("value").then((s) => {
            const v = s.val() || {};
            return Promise.all(Object.keys(v).map(k => {
                const o = v[k];
                if (Date.now() - (o.t || 0) < 120000)
                    return;
                return db.ref("inbox/" + uid + "/bj_" + k).once("value").then((ib) => {
                    if (ib.exists())
                        return;
                    if (W && W.ap && W.ap[safeKey("in_bj_" + k)])
                        return db.ref("users/" + uid + "/bj/open/" + k).remove();
                    return roomExistsFn(o.c, o.r).then(live => {
                        if (live)
                            return;
                        return applyTx({ id: "refund_" + k, delta: o.a, reason: "blackjack_refund" }).then(r => { if (r.ok || r.dup)
                            return db.ref("users/" + uid + "/bj/open/" + k).remove(); });
                    });
                });
            }));
        }).then(() => undefined).catch(() => undefined);
    }
    SHK.recoverOpenBets = recoverOpenBets;
    function bjStats() {
        return db.ref("users/" + uid + "/bj/stats").once("value").then((s) => Object.assign(emptyStats(), s.val() || {}));
    }
    SHK.bjStats = bjStats;
    function bjAchievements() {
        return db.ref("users/" + uid + "/bj/ach").once("value").then((s) => s.val() || {});
    }
    SHK.bjAchievements = bjAchievements;
    function recordBjRound(roundKey, seat) {
        const key = safeKey(roundKey);
        let applied = false, out = null;
        return safeTx(db.ref("users/" + uid + "/bj/stats"), (cur) => {
            const r = applyRoundToStats(cur, key, seat);
            applied = r.applied;
            out = r.s;
            return r.applied ? r.s : undefined;
        }).then(() => (out && applied ? checkAchievements(out) : []));
    }
    SHK.recordBjRound = recordBjRound;
    function checkAchievements(s) {
        const run = (st) => bjAchievements().then(have => {
            const earned = newlyEarned(st, W, have);
            return earned.reduce((p, a) => p.then(list => applyTx({ id: "ach_" + a.id, delta: a.reward, reason: "blackjack_achievement" }).then(r => {
                if (!r.ok && !r.dup)
                    return list;
                return db.ref("users/" + uid + "/bj/ach/" + a.id).set(Date.now()).then(() => { list.push(a); return list; });
            })), Promise.resolve([]));
        });
        return (s ? Promise.resolve(s) : bjStats()).then(run);
    }
    SHK.checkAchievements = checkAchievements;
})(SHK || (SHK = {}));
