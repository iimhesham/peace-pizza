"use strict";
var BJE;
(function (BJE) {
    BJE.RULES = {
        DECKS: 6,
        RESHUFFLE_BELOW: 52,
        MAX_HANDS: 4,
        MIN_BET: 10,
        MAX_BET: 500,
        BET_STEP: 10,
        INSURANCE_PAY: 2
    };
    BJE.RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    BJE.SUITS = ["S", "H", "D", "C"];
    function randInt(n) {
        const c = typeof crypto !== "undefined" ? crypto : null;
        if (c && c.getRandomValues) {
            const lim = Math.floor(4294967296 / n) * n;
            const a = new Uint32Array(1);
            do {
                c.getRandomValues(a);
            } while (a[0] >= lim);
            return a[0] % n;
        }
        return Math.floor(Math.random() * n);
    }
    BJE.randInt = randInt;
    function shuffle(arr, rng) {
        const r = rng || randInt, a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = r(i + 1);
            const t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }
    BJE.shuffle = shuffle;
    function rankOf(c) { return c.slice(0, -1); }
    BJE.rankOf = rankOf;
    function suitOf(c) { return c.slice(-1); }
    BJE.suitOf = suitOf;
    function cardValue(rankOrCard) {
        const r = BJE.RANKS.indexOf(rankOrCard) >= 0 ? rankOrCard : rankOf(rankOrCard);
        if (r === "A")
            return 11;
        if (r === "J" || r === "Q" || r === "K" || r === "10")
            return 10;
        return parseInt(r, 10);
    }
    BJE.cardValue = cardValue;
    function createShoe(decks) {
        const n = decks || BJE.RULES.DECKS, s = [];
        for (let d = 0; d < n; d++)
            for (const su of BJE.SUITS)
                for (const r of BJE.RANKS)
                    s.push(r + su);
        return s;
    }
    BJE.createShoe = createShoe;
    function freshShoe(rng) { return shuffle(createShoe(BJE.RULES.DECKS), rng); }
    BJE.freshShoe = freshShoe;
    function prepareShoe(shoe, rng) {
        if (!shoe || shoe.length < BJE.RULES.RESHUFFLE_BELOW)
            return { shoe: freshShoe(rng), reshuffled: true };
        return { shoe: shoe, reshuffled: false };
    }
    BJE.prepareShoe = prepareShoe;
    function evaluate(cards) {
        let sum = 0, aces = 0;
        for (const c of cards) {
            const r = rankOf(c);
            if (r === "A") {
                aces++;
                sum += 1;
            }
            else
                sum += cardValue(r);
        }
        let total = sum, soft = false;
        if (aces > 0 && sum + 10 <= 21) {
            total = sum + 10;
            soft = true;
        }
        const bust = total > 21;
        const blackjack = cards.length === 2 && aces === 1 && sum === 11;
        const label = bust ? "Bust " + total : blackjack ? "Blackjack" : (soft ? "Soft " : "Hard ") + total;
        return { total, soft, bust, blackjack, label };
    }
    BJE.evaluate = evaluate;
    function dealerShouldHit(cards) { return evaluate(cards).total < 17; }
    BJE.dealerShouldHit = dealerShouldHit;
    function newHand(bet, cards) {
        return { cards: cards || [], bet: bet, fromSplit: false, splitAces: false, doubled: false, stood: false, surrendered: false, acted: false, done: false };
    }
    BJE.newHand = newHand;
    function isNatural(h) {
        return !h.fromSplit && !h.doubled && h.cards.length === 2 && evaluate(h.cards).blackjack;
    }
    BJE.isNatural = isNatural;
    function validBet(b, min, max) {
        const lo = min || BJE.RULES.MIN_BET, hi = max || BJE.RULES.MAX_BET;
        return typeof b === "number" && isFinite(b) && Math.floor(b) === b && b >= lo && b <= hi && b % BJE.RULES.BET_STEP === 0;
    }
    BJE.validBet = validBet;
    function draw(r) {
        const c = r.shoe.pop();
        if (!c)
            throw new Error("shoe empty");
        return c;
    }
    function startRound(o) {
        if (!o.entrants.length)
            throw new Error("no players");
        o.entrants.forEach(e => { if (!validBet(e.bet, o.minBet, o.maxBet))
            throw new Error("bad bet"); });
        const p = prepareShoe(o.shoe, o.rng);
        const r = {
            id: o.id, phase: "DEALING", shoe: p.shoe, dealer: [], holeShown: false,
            seats: o.entrants.map(e => ({ id: e.id, uid: e.uid || "", name: e.name || "", hands: [newHand(e.bet)], insurance: 0, insAsked: false })),
            turn: null, dealerBJ: false, peeked: false, reshuffled: p.reshuffled, result: null
        };
        r.seats.forEach(s => s.hands[0].cards.push(draw(r)));
        r.dealer.push(draw(r));
        r.seats.forEach(s => s.hands[0].cards.push(draw(r)));
        r.dealer.push(draw(r));
        r.phase = "INITIAL_CHECK";
        initialCheck(r);
        return r;
    }
    BJE.startRound = startRound;
    function initialCheck(r) {
        const up = rankOf(r.dealer[0]);
        if (up === "A") {
            r.phase = "INSURANCE";
            return;
        }
        if (cardValue(up) === 10) {
            peek(r);
            return;
        }
        beginPlayerTurns(r);
    }
    function peek(r) {
        r.peeked = true;
        r.dealerBJ = evaluate(r.dealer).blackjack;
        if (r.dealerBJ) {
            r.holeShown = true;
            r.turn = null;
            finish(r);
            return;
        }
        beginPlayerTurns(r);
    }
    function finish(r) { r.result = settle(r); r.phase = "SETTLEMENT"; r.turn = null; }
    function beginPlayerTurns(r) {
        r.phase = "PLAYER_TURNS";
        r.seats.forEach(s => s.hands.forEach(h => { if (isNatural(h)) {
            h.stood = true;
            h.done = true;
        } }));
        r.turn = { s: 0, h: 0 };
        advance(r, true);
    }
    function insuranceMax(bet) { return Math.floor(bet / 2); }
    BJE.insuranceMax = insuranceMax;
    function setInsurance(r, seatIdx, amount) {
        if (r.phase !== "INSURANCE" || rankOf(r.dealer[0]) !== "A")
            return { ok: false, err: "no insurance now" };
        const s = r.seats[seatIdx];
        if (!s || s.insAsked)
            return { ok: false, err: "already answered" };
        const max = insuranceMax(s.hands[0].bet);
        if (typeof amount !== "number" || Math.floor(amount) !== amount || amount < 0 || amount > max)
            return { ok: false, err: "bad insurance amount" };
        s.insurance = amount;
        s.insAsked = true;
        if (r.seats.every(x => x.insAsked))
            peek(r);
        return { ok: true, extra: amount };
    }
    BJE.setInsurance = setInsurance;
    function curHand(r, seatIdx) {
        if (r.phase !== "PLAYER_TURNS" || !r.turn || r.turn.s !== seatIdx)
            return null;
        return r.seats[seatIdx].hands[r.turn.h] || null;
    }
    BJE.curHand = curHand;
    function legalFor(h, nHands, balance) {
        const none = { hit: false, stand: false, double: false, split: false, surrender: false };
        if (!h || h.done || h.stood || h.surrendered)
            return none;
        const ev = evaluate(h.cards);
        if (ev.bust)
            return none;
        const bal = balance === undefined ? Infinity : balance;
        const two = h.cards.length === 2;
        const natural = !h.fromSplit && !h.doubled && two && ev.blackjack;
        return {
            hit: !h.splitAces && !h.doubled && ev.total < 21,
            stand: true,
            double: two && !h.splitAces && !h.doubled && bal >= h.bet,
            split: two && !h.splitAces && rankOf(h.cards[0]) === rankOf(h.cards[1]) && nHands < BJE.RULES.MAX_HANDS && bal >= h.bet,
            surrender: two && nHands === 1 && !h.fromSplit && !h.doubled && !h.splitAces && !natural
        };
    }
    BJE.legalFor = legalFor;
    function legal(r, seatIdx, balance) {
        const h = curHand(r, seatIdx);
        if (!h)
            return { hit: false, stand: false, double: false, split: false, surrender: false };
        return legalFor(h, r.seats[seatIdx].hands.length, balance);
    }
    BJE.legal = legal;
    function act(r, seatIdx, action, balance) {
        const L = legal(r, seatIdx, balance);
        if (!L[action])
            return { ok: false, err: "illegal action" };
        const seat = r.seats[seatIdx], hi = r.turn.h, h = seat.hands[hi];
        let extra = 0;
        if (action === "hit") {
            h.cards.push(draw(r));
            h.acted = true;
            const ev = evaluate(h.cards);
            if (ev.bust)
                h.done = true;
            else if (ev.total === 21) {
                h.stood = true;
                h.done = true;
            }
        }
        else if (action === "stand") {
            h.stood = true;
            h.done = true;
        }
        else if (action === "double") {
            extra = h.bet;
            h.bet = h.bet * 2;
            h.doubled = true;
            h.acted = true;
            h.cards.push(draw(r));
            h.done = true;
        }
        else if (action === "split") {
            extra = h.bet;
            const aces = rankOf(h.cards[0]) === "A";
            const a = newHand(h.bet, [h.cards[0]]), b = newHand(h.bet, [h.cards[1]]);
            a.fromSplit = b.fromSplit = true;
            a.splitAces = b.splitAces = aces;
            a.cards.push(draw(r));
            b.cards.push(draw(r));
            [a, b].forEach(x => {
                if (aces || evaluate(x.cards).total === 21) {
                    x.stood = true;
                    x.done = true;
                }
            });
            seat.hands.splice(hi, 1, a, b);
        }
        else if (action === "surrender") {
            h.surrendered = true;
            h.done = true;
        }
        advance(r, false);
        return { ok: true, extra: extra };
    }
    BJE.act = act;
    function advance(r, fromStart) {
        if (!r.turn)
            return;
        let s = r.turn.s, h = r.turn.h;
        for (; s < r.seats.length; s++, h = 0) {
            const hands = r.seats[s].hands;
            for (; h < hands.length; h++)
                if (!hands[h].done) {
                    r.turn = { s: s, h: h };
                    return;
                }
        }
        r.turn = null;
        r.phase = "DEALER_TURN";
    }
    function needsDealerDraw(r) {
        return r.seats.some(s => s.hands.some(h => !h.surrendered && !isNatural(h) && !evaluate(h.cards).bust));
    }
    BJE.needsDealerDraw = needsDealerDraw;
    function dealerStep(r) {
        if (r.phase !== "DEALER_TURN")
            return { done: r.phase === "SETTLEMENT" || r.phase === "ROUND_COMPLETE", act: "none" };
        if (!r.holeShown) {
            r.holeShown = true;
            return { done: false, act: "reveal" };
        }
        if (needsDealerDraw(r) && dealerShouldHit(r.dealer)) {
            const c = draw(r);
            r.dealer.push(c);
            return { done: false, act: "hit", card: c };
        }
        finish(r);
        return { done: true, act: "stand" };
    }
    BJE.dealerStep = dealerStep;
    function dealerPlay(r) { let g = 0; while (!dealerStep(r).done && ++g < 60) { } }
    BJE.dealerPlay = dealerPlay;
    function settleHand(h, dealer) {
        const ev = evaluate(h.cards), dEv = evaluate(dealer), dBJ = dealer.length === 2 && dEv.blackjack, nat = isNatural(h);
        let outcome, ret;
        if (h.surrendered) {
            outcome = "surrender";
            ret = Math.floor(h.bet / 2);
        }
        else if (ev.bust) {
            outcome = "loss";
            ret = 0;
        }
        else if (nat) {
            if (dBJ) {
                outcome = "push";
                ret = h.bet;
            }
            else {
                outcome = "blackjack";
                ret = h.bet + Math.floor(h.bet * 3 / 2);
            }
        }
        else if (dBJ) {
            outcome = "loss";
            ret = 0;
        }
        else if (dEv.bust) {
            outcome = "win";
            ret = h.bet * 2;
        }
        else if (ev.total > dEv.total) {
            outcome = "win";
            ret = h.bet * 2;
        }
        else if (ev.total < dEv.total) {
            outcome = "loss";
            ret = 0;
        }
        else {
            outcome = "push";
            ret = h.bet;
        }
        return { idx: 0, outcome: outcome, bet: h.bet, ret: ret, net: ret - h.bet, cards: h.cards.slice(), total: ev.total, bust: ev.bust, natural: nat, doubled: h.doubled, fromSplit: h.fromSplit };
    }
    BJE.settleHand = settleHand;
    function settle(r) {
        const dEv = evaluate(r.dealer), dBJ = r.dealer.length === 2 && dEv.blackjack;
        const seats = r.seats.map(s => {
            const hands = s.hands.map((h, i) => { const x = settleHand(h, r.dealer); x.idx = i; return x; });
            const won = dBJ && s.insurance > 0;
            const ins = { amount: s.insurance, won: won, ret: won ? s.insurance + s.insurance * BJE.RULES.INSURANCE_PAY : 0 };
            const staked = hands.reduce((a, x) => a + x.bet, 0) + s.insurance;
            const returned = hands.reduce((a, x) => a + x.ret, 0) + ins.ret;
            return { id: s.id, uid: s.uid, name: s.name, hands: hands, ins: ins, staked: staked, returned: returned, net: returned - staked };
        });
        return { dealerTotal: dEv.total, dealerBust: dEv.bust, dealerBJ: dBJ, seats: seats };
    }
    BJE.settle = settle;
    function publicView(r) {
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
    BJE.publicView = publicView;
    function rig(order) {
        const filler = [];
        for (let i = 0; i < 80; i++)
            filler.push("2C");
        return filler.concat(order.slice().reverse());
    }
    BJE.rig = rig;
})(BJE || (BJE = {}));
