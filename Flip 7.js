// ==UserScript==
// @name         BGA Flip Seven Card Counter
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Card counter for Flip Seven on BoardGameArena - reads the live board state for instant, drift-free counts; auto language (EN/DE/FR/ES/PT/IT/RU/JA/ZH)
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
    // Localization. English is the fallback language.
    // Number cards, +N modifiers, x2 and Flip 3 use universal symbols; the
    // Second Chance / Freeze names and the Busted / Frozen status are translated.
    // ---------------------------------------------------------------------------
    var I18N = {
        en: { title: 'Flip 7 Counter', chance: 'Second Chance', freeze: 'Freeze', busted: 'Busted', frozen: 'Frozen' },
        de: { title: 'Flip 7 Zähler', chance: 'Zweite Chance', freeze: 'Einfrieren', busted: 'Verzockt', frozen: 'Eingefroren' },
        fr: { title: 'Compteur Flip 7', chance: 'Seconde chance', freeze: 'Gel', busted: 'Éliminé', frozen: 'Gelé' },
        es: { title: 'Contador Flip 7', chance: 'Segunda oportunidad', freeze: 'Congelar', busted: 'Eliminado', frozen: 'Congelado' },
        pt: { title: 'Contador Flip 7', chance: 'Segunda chance', freeze: 'Congelar', busted: 'Eliminado', frozen: 'Congelado' },
        it: { title: 'Contatore Flip 7', chance: 'Seconda chance', freeze: 'Congelamento', busted: 'Eliminato', frozen: 'Congelato' },
        ru: { title: 'Счётчик Flip 7', chance: 'Второй шанс', freeze: 'Заморозка', busted: 'Перебор', frozen: 'Заморожен' },
        ja: { title: 'Flip 7 カウンター', chance: 'セカンドチャンス', freeze: 'フリーズ', busted: 'バースト', frozen: 'フリーズ' },
        zhcn: { title: 'Flip7 记牌', chance: '第二次机会', freeze: '冻结', busted: '爆牌', frozen: '冻结' },
        zhtw: { title: 'Flip7 記牌', chance: '第二次機會', freeze: '凍結', busted: '爆牌', frozen: '凍結' }
    };

    function resolveLang() {
        var list = (navigator.languages && navigator.languages.length) ? navigator.languages
            : [navigator.language || 'en'];
        for (var i = 0; i < list.length; i++) {
            var l = (list[i] || '').toLowerCase();
            if (l.indexOf('zh') === 0) {
                if (l.indexOf('tw') !== -1 || l.indexOf('hk') !== -1 || l.indexOf('hant') !== -1) return 'zhtw';
                return 'zhcn';
            }
            var base = l.split('-')[0];
            if (I18N[base]) return base;
        }
        return 'en';
    }
    var LANG = resolveLang();
    function t(key) {
        return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
    }

    // ---------------------------------------------------------------------------
    // Card type metadata. Material indices index gamedatas.materials.cards.
    // The deck has 94 cards. Remaining of a type = fixed total - cards currently
    // outside the draw deck (deck2=discard, player=in play, wait=being dealt).
    // When the discard pile is shuffled back, those cards return to "deck" and
    // count again automatically, so no explicit reshuffle detection is needed.
    // ---------------------------------------------------------------------------
    var ORDER = [
        { i: 12, total: 12 }, { i: 11, total: 11 }, { i: 10, total: 10 },
        { i: 9, total: 9 }, { i: 8, total: 8 }, { i: 7, total: 7 },
        { i: 6, total: 6 }, { i: 5, total: 5 }, { i: 4, total: 4 },
        { i: 3, total: 3 }, { i: 2, total: 2 }, { i: 1, total: 1 },
        { i: 0, total: 1 },
        { i: 20, lab: 'Flip 3', total: 3 },
        { i: 21, tx: 'chance', total: 3 },
        { i: 19, tx: 'freeze', total: 3 },
        { i: 13, lab: '+2', total: 1 },
        { i: 14, lab: '+4', total: 1 },
        { i: 15, lab: '+6', total: 1 },
        { i: 16, lab: '+8', total: 1 },
        { i: 17, lab: '+10', total: 1 },
        { i: 18, lab: '\u00d72', total: 1 }
    ];
    function labelOf(o) {
        if (o.tx) return t(o.tx);
        if (o.lab) return o.lab;
        return '' + o.i; // number cards show their value
    }

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

        var html = '<b>' + t('title') + '</b><hr style="margin:6px 0;">';
        html += '<table style="border-collapse:collapse;width:100%;">';
        var newValues = {};
        ORDER.forEach(function (o) {
            var v = data.remaining[o.i];
            newValues[o.i] = v;
            var percent = Math.round(v / denom * 100);
            html += '<tr><td style="padding:2px 6px;white-space:nowrap;">' + labelOf(o) + '</td>' +
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
                status = '<span style="color:#888;">' + t('busted') + '</span>';
            } else if (p.status === 'FREEZED') {
                status = '<span style="color:#3a86b5;">' + t('frozen') + '</span>';
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
