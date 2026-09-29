// ==UserScript==
// @name         BGA Flip Seven Card Counter
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Card counter for Flip Seven on BoardGameArena - reads the live board state for instant, drift-free counts (no log replay)
// @author       豆包 2.1 Pro & KuRRe8
// @match        https://boardgamearena.com/*/flipseven?table=*
// @icon         https://boardgamearena.com/favicon.ico
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    if (window.__flip7Loaded) return;
    window.__flip7Loaded = true;

    // ---------------------------------------------------------------------------
    // Card type metadata. Material indices index gamedatas.materials.cards.
    // The deck has 94 cards: number cards (materials 0-12) plus special cards.
    // Remaining of a type = fixed total - cards currently outside the draw deck
    // (locations deck2=discard, player=in play, wait=being dealt). When the
    // discard pile is shuffled back, those cards return to "deck" and count
    // again automatically, so no explicit reshuffle detection is needed.
    // ---------------------------------------------------------------------------
    var ORDER = [
        { i: 12, label: '12card', total: 12 },
        { i: 11, label: '11card', total: 11 },
        { i: 10, label: '10card', total: 10 },
        { i: 9,  label: '9card',  total: 9 },
        { i: 8,  label: '8card',  total: 8 },
        { i: 7,  label: '7card',  total: 7 },
        { i: 6,  label: '6card',  total: 6 },
        { i: 5,  label: '5card',  total: 5 },
        { i: 4,  label: '4card',  total: 4 },
        { i: 3,  label: '3card',  total: 3 },
        { i: 2,  label: '2card',  total: 2 },
        { i: 1,  label: '1card',  total: 1 },
        { i: 0,  label: '0card',  total: 1 },
        { i: 20, label: 'flip3', total: 3 },
        { i: 21, label: 'Second chance', total: 3 },
        { i: 19, label: 'Freeze', total: 3 },
        { i: 13, label: 'Plus2', total: 1 },
        { i: 14, label: 'Plus4', total: 1 },
        { i: 15, label: 'Plus6', total: 1 },
        { i: 16, label: 'Plus8', total: 1 },
        { i: 17, label: 'Plus10', total: 1 },
        { i: 18, label: 'double', total: 1 }
    ];

    // Fraction (as %) of the number cards still available that would NOT bust
    // this player, i.e. whose value they do not currently hold.
    function safeRate(held, remaining) {
        var safe = 0, total = 0, m;
        for (m = 0; m <= 12; m++) {
            var r = remaining[m] || 0;
            total += r;
            if (!held.has(m)) safe += r;
        }
        return total ? Math.round(safe / total * 100) : 0;
    }

    // Build the current state directly from the live board (one shot, no replay).
    function compute() {
        var gd = window.gameui.gamedatas;
        var cards = gd.board.cards;
        var outside = {}; // material index -> count outside the draw deck
        cards.forEach(function (c) {
            if (c.location !== 'deck' && c.materialId != null) {
                var m = +c.materialId;
                outside[m] = (outside[m] || 0) + 1;
            }
        });
        var remaining = {};
        ORDER.forEach(function (o) {
            remaining[o.i] = o.total - (outside[o.i] || 0);
        });
        var players = Object.keys(gd.players).map(function (pid) {
            var p = gd.players[pid];
            var held = new Set();
            cards.forEach(function (c) {
                if (c.location === 'player' && ('' + c.locationId) === ('' + p.no) && +c.materialId <= 12) {
                    held.add(+c.materialId);
                }
            });
            return {
                name: p.name, no: p.no, status: p.status,
                eliminated: +p.eliminated, rate: safeRate(held, remaining)
            };
        });
        return { remaining: remaining, players: players };
    }

    var panel = null, prevValues = null;

    function createPanel() {
        if (panel) return;
        panel = document.createElement('div');
        panel.id = 'flipseven-card-counter-panel';
        panel.style.cssText =
            'position:fixed;top:80px;right:20px;z-index:2147483647;' +
            'background:rgba(173,216,230,0.88);border:1px solid #5bb;border-radius:8px;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.18);padding:12px 16px;font-size:15px;color:#222;' +
            'max-height:84vh;overflow-y:auto;min-width:190px;user-select:none;';
        document.body.appendChild(panel);
        makeDraggable(panel);
    }

    function makeDraggable(el) {
        var dragging = false, ox = 0, oy = 0, moved = false;
        el.style.cursor = 'move';
        el.addEventListener('mousedown', function (e) {
            dragging = true; moved = false;
            var r = el.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
        });
        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            moved = true;
            el.style.left = (e.clientX - ox) + 'px';
            el.style.top = (e.clientY - oy) + 'px';
            el.style.right = '';
        });
        document.addEventListener('mouseup', function () {
            dragging = false;
            setTimeout(function () { moved = false; }, 0);
        });
    }

    function countColor(v) {
        if (v === 1 || v === 2) return '#2ecc40';
        if (v >= 3 && v <= 5) return '#ffdc00';
        if (v > 5) return '#ff4136';
        return '#888';
    }

    function render(data) {
        createPanel();
        if (!data) return;

        var totalLeft = 0;
        ORDER.forEach(function (o) { totalLeft += data.remaining[o.i]; });
        var denom = totalLeft || 1;

        var html = '<b>Flip Seven Counter</b><hr style="margin:6px 0;">';
        html += '<table style="border-collapse:collapse;width:100%;">';
        var newValues = {};
        ORDER.forEach(function (o) {
            var v = data.remaining[o.i];
            newValues[o.i] = v;
            var percent = Math.round(v / denom * 100);
            html += '<tr><td style="padding:2px 6px;">' + o.label + '</td>' +
                '<td class="f7-num" data-i="' + o.i + '" style="padding:2px 6px;text-align:right;font-weight:bold;color:' +
                countColor(v) + ';">' + v +
                ' <span style="font-size:0.9em;color:#888;font-weight:normal;">(' + percent + '%)</span></td></tr>';
        });
        html += '</table><div style="height:14px;"></div>';

        html += '<div style="font-size:1.15em;text-align:left;">';
        data.players.forEach(function (p) {
            var short = p.name.length > 10 ? p.name.slice(0, 10) : p.name;
            var status;
            if (p.status === 'BUSTED' || p.eliminated) {
                status = '<span style="color:#888;">Busted</span>';
            } else if (p.status === 'FREEZED') {
                status = '<span style="color:#3a86b5;">Freezed</span>';
            } else {
                var c = p.rate < 30 ? '#b94a48' : (p.rate < 50 ? '#bfae3b' : '#4a7b5b');
                status = '<span style="color:' + c + ';font-weight:bold;">' + p.rate + '%</span>';
            }
            html += '<div style="margin-bottom:2px;"><span style="display:inline-block;max-width:6.5em;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;">' +
                short + '</span> ' + status + '</div>';
        });
        html += '</div>';

        panel.innerHTML = html;

        // Briefly flash count cells whose value changed (preserves the original feedback).
        if (prevValues) {
            ORDER.forEach(function (o) {
                if (prevValues[o.i] !== newValues[o.i]) {
                    var cell = panel.querySelector('.f7-num[data-i="' + o.i + '"]');
                    if (cell) {
                        cell.style.transition = 'background 0.2s';
                        cell.style.background = '#fff7b2';
                        setTimeout(function () { cell.style.background = ''; }, 200);
                    }
                }
            });
        }
        prevValues = newValues;
    }

    // ---------------------------------------------------------------------------
    // Instant updates. Subscribe to the same dojo notification topics the game
    // uses to mutate the board, and keep a short fallback poll as a safety net.
    // ---------------------------------------------------------------------------
    var queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        var run = function () { queued = false; render(compute()); };
        if (window.requestAnimationFrame) requestAnimationFrame(run);
        else setTimeout(run, 16);
    }

    function hook() {
        if (window.dojo && dojo.subscribe) {
            ['boardUpdate', 'moveTokens', 'updatePlayers', 'updateScores', 'board'].forEach(function (tp) {
                try { dojo.subscribe(tp, window, function () { schedule(); }); } catch (e) {}
            });
        }
        setInterval(function () { render(compute()); }, 200);
    }

    function waitForGame() {
        var tries = 0;
        var timer = setInterval(function () {
            var ready = window.gameui && window.gameui.gamedatas &&
                window.gameui.gamedatas.board && window.gameui.gamedatas.board.cards;
            if (ready) {
                clearInterval(timer);
                hook();
                render(compute());
            } else if (++tries > 60) {
                clearInterval(timer);
            }
        }, 200);
    }

    if (document.body) waitForGame();
    else document.addEventListener('DOMContentLoaded', waitForGame);
})();
