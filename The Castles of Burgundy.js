// ==UserScript==
// @name            BGA Castles of Burgundy Tile Counter
// @namespace       https://github.com/KuRRe8
// @version         1.4.1
// @description     Floating panel showing how many tiles of each type remain (instant updates on move/undo), knowledge-tile trackers, and sold-goods breakdown tooltips for every player (auto language)
// @author          豆包 2.1 Pro
// @match           https://boardgamearena.com/*/castlesofburgundy?table=*
// @match           https://boardgamearena.com/castlesofburgundy?table=*
// @icon            https://boardgamearena.com/favicon.ico
// @run-at          document-idle
// @grant           none
// ==/UserScript==

(function () {
  'use strict';
  if (window.__cobCounterLoaded) return;
  window.__cobCounterLoaded = true;

  // ---------------------------------------------------------------------------
  // Localization. English is the fallback language.
  // Row keys double as category identifiers used by the counting logic.
  // ---------------------------------------------------------------------------
  var I18N = {
    en: {
      title: 'CoB Tile Counter', wait: 'Waiting for game data…', collapse: 'Collapse', expand: 'Expand', privmark: '★',
      chengbao: 'Castle', kuangchang: 'Mine', chuanbo: 'Ship',
      mianyang: 'Sheep', shanyang: 'Goat', zhu: 'Pig', niu: 'Cow', knowledge: 'Knowledge',
      huocang: 'Warehouse', mujiang: 'Carpenter', jiaotang: 'Church', shiji: 'Market',
      sushe: 'Boarding House', yinhang: 'Bank', shizheng: 'Town Hall', liaowang: 'Watchtower'
    },
    de: {
      title: 'CoB Plättchenzähler', wait: 'Warte auf Spieldaten…', collapse: 'Einklappen', expand: 'Ausklappen', privmark: '★',
      chengbao: 'Burg', kuangchang: 'Mine', chuanbo: 'Schiff',
      mianyang: 'Schaf', shanyang: 'Ziege', zhu: 'Schwein', niu: 'Kuh', knowledge: 'Wissen',
      huocang: 'Warenhaus', mujiang: 'Schreinerei', jiaotang: 'Kirche', shiji: 'Markt',
      sushe: 'Wohnhaus', yinhang: 'Bank', shizheng: 'Rathaus', liaowang: 'Wachturm'
    },
    fr: {
      title: 'Compteur de tuiles CoB', wait: 'En attente des données…', collapse: 'Réduire', expand: 'Déplier', privmark: '★',
      chengbao: 'Château', kuangchang: 'Mine', chuanbo: 'Bateau',
      mianyang: 'Mouton', shanyang: 'Chèvre', zhu: 'Cochon', niu: 'Vache', knowledge: 'Savoir',
      huocang: 'Entrepôt', mujiang: 'Charpentier', jiaotang: 'Église', shiji: 'Marché',
      sushe: 'Pension', yinhang: 'Banque', shizheng: 'Hôtel de ville', liaowang: 'Tour de guet'
    },
    es: {
      title: 'Contador de losetas CoB', wait: 'Esperando datos de la partida…', collapse: 'Contraer', expand: 'Expandir', privmark: '★',
      chengbao: 'Castillo', kuangchang: 'Mina', chuanbo: 'Barco',
      mianyang: 'Oveja', shanyang: 'Cabra', zhu: 'Cerdo', niu: 'Vaca', knowledge: 'Conocimiento',
      huocang: 'Almacén', mujiang: 'Carpintero', jiaotang: 'Iglesia', shiji: 'Mercado',
      sushe: 'Pensión', yinhang: 'Banco', shizheng: 'Ayuntamiento', liaowang: 'Atalaya'
    },
    pt: {
      title: 'Contador de Peças CoB', wait: 'Aguardando dados do jogo…', collapse: 'Recolher', expand: 'Expandir', privmark: '★',
      chengbao: 'Castelo', kuangchang: 'Mina', chuanbo: 'Navio',
      mianyang: 'Ovelha', shanyang: 'Cabra', zhu: 'Porco', niu: 'Vaca', knowledge: 'Conhecimento',
      huocang: 'Armazém', mujiang: 'Carpinteiro', jiaotang: 'Igreja', shiji: 'Mercado',
      sushe: 'Pensão', yinhang: 'Banco', shizheng: 'Câmara Municipal', liaowang: 'Torre de vigia'
    },
    it: {
      title: 'Contatore Tessere CoB', wait: 'In attesa dei dati di gioco…', collapse: 'Comprimi', expand: 'Espandi', privmark: '★',
      chengbao: 'Castello', kuangchang: 'Miniera', chuanbo: 'Nave',
      mianyang: 'Pecora', shanyang: 'Capra', zhu: 'Maiale', niu: 'Mucca', knowledge: 'Conoscenza',
      huocang: 'Magazzino', mujiang: 'Falegname', jiaotang: 'Chiesa', shiji: 'Mercato',
      sushe: 'Pensione', yinhang: 'Banca', shizheng: 'Municipio', liaowang: 'Torre di guardia'
    },
    ru: {
      title: 'Счётчик плиток CoB', wait: 'Ожидание данных игры…', collapse: 'Свернуть', expand: 'Развернуть', privmark: '★',
      chengbao: 'Замок', kuangchang: 'Шахта', chuanbo: 'Корабль',
      mianyang: 'Овца', shanyang: 'Коза', zhu: 'Свинья', niu: 'Корова', knowledge: 'Знания',
      huocang: 'Склад', mujiang: 'Плотник', jiaotang: 'Церковь', shiji: 'Рынок',
      sushe: 'Пансион', yinhang: 'Банк', shizheng: 'Ратуша', liaowang: 'Сторожевая башня'
    },
    ja: {
      title: 'CoB タイルカウンター', wait: 'ゲームデータを待機中…', collapse: '折りたたみ', expand: '展開', privmark: '特',
      chengbao: '城', kuangchang: '鉱山', chuanbo: '船',
      mianyang: '羊', shanyang: '山羊', zhu: '豚', niu: '牛', knowledge: '知識',
      huocang: '倉庫', mujiang: '大工', jiaotang: '教会', shiji: '市場',
      sushe: '寄宿舎', yinhang: '銀行', shizheng: '市庁舎', liaowang: '見張り塔'
    },
    zhcn: {
      title: '勃艮第记牌', wait: '等待游戏数据…', collapse: '折叠', expand: '展开', privmark: '特',
      chengbao: '城堡', kuangchang: '矿场', chuanbo: '船舶',
      mianyang: '绵羊', shanyang: '山羊', zhu: '猪', niu: '牛', knowledge: '特权',
      huocang: '货舱', mujiang: '木匠', jiaotang: '教堂', shiji: '市集',
      sushe: '宿舍', yinhang: '银行', shizheng: '市政', liaowang: '瞭望'
    },
    zhtw: {
      title: '勃艮第記牌', wait: '等待遊戲資料…', collapse: '摺疊', expand: '展開', privmark: '特',
      chengbao: '城堡', kuangchang: '礦場', chuanbo: '船舶',
      mianyang: '綿羊', shanyang: '山羊', zhu: '豬', niu: '牛', knowledge: '特權',
      huocang: '貨艙', mujiang: '木匠', jiaotang: '教堂', shiji: '市集',
      sushe: '宿舍', yinhang: '銀行', shizheng: '市政', liaowang: '瞭望'
    }
  };

  // Pick the best supported language from the browser preference list.
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
  // Sprite position -> category key. The sprite sheet is 8 columns x 10 rows.
  // Both normal and black-backed variants map to the same category.
  // Knowledge (yellow) tiles are sprites 16-41 (= knowledge tiles 1-26).
  // ---------------------------------------------------------------------------
  function catOf(s) {
    s = +s;
    if (s === 0 || s === 8) return 'huocang';    // Warehouse
    if (s === 1 || s === 9) return 'mujiang';    // Carpenter
    if (s === 2 || s === 10) return 'jiaotang';  // Church
    if (s === 3 || s === 11) return 'shiji';     // Market
    if (s === 4 || s === 12) return 'sushe';     // Boarding House
    if (s === 5 || s === 13) return 'yinhang';   // Bank
    if (s === 6 || s === 14) return 'shizheng';  // Town Hall
    if (s === 7 || s === 15) return 'liaowang';  // Watchtower
    if (s === 42 || s === 43) return 'chengbao'; // Castle
    if (s === 44 || s === 45) return 'kuangchang'; // Mine
    if (s === 46 || s === 47) return 'chuanbo';  // Ship
    if (s >= 48 && s <= 52) return 'shanyang';   // Goat
    if (s >= 53 && s <= 57) return 'niu';        // Cow
    if (s >= 58 && s <= 62) return 'zhu';        // Pig
    if (s >= 63 && s <= 67) return 'mianyang';   // Sheep
    if (s >= 16 && s <= 41) return 'priv' + s;   // Knowledge tiles 1-26
    return null;
  }

  // Display order and fixed totals (4-player game). Second item is the i18n key.
  var ROWS = [
    ['chengbao',   'chengbao',   16],
    ['kuangchang', 'kuangchang', 12],
    ['chuanbo',    'chuanbo',    26],
    ['mianyang',   'mianyang',   7],
    ['shanyang',   'shanyang',   7],
    ['zhu',        'zhu',        7],
    ['niu',        'niu',        7],
    ['__priv__',   'knowledge',  null],
    ['huocang',    'huocang',    7],
    ['mujiang',    'mujiang',    7],
    ['jiaotang',   'jiaotang',   7],
    ['shiji',      'shiji',      7],
    ['sushe',      'sushe',      7],
    ['yinhang',    'yinhang',    7],
    ['shizheng',   'shizheng',   7],
    ['liaowang',   'liaowang',   7]
  ];

  // Knowledge tile numbers displayed on the dedicated privilege row.
  var PRIV_NUMBER_ROW = [6, 7, 13, 14, 15, 24, 25, 26];
  function privNumberToSprite(n) { return 15 + n; } // knowledge tile N -> sprite

  // Building category -> the sprite of its linked knowledge tile (tiles 16-23).
  var BUILDING_PRIV = {
    huocang: 31, liaowang: 32, mujiang: 33, jiaotang: 34,
    shiji: 35, sushe: 36, yinhang: 37, shizheng: 38
  };

  var GREEN = '#2ecc40';
  var GRAY = '#9aa0a6';

  // ---------------------------------------------------------------------------
  // Live counting from the DOM. The client never mutates gamedatas after setup,
  // but every notification immediately creates tiles (placeTile) or reparents
  // them (slideToDomNode), so the DOM is the real-time source of truth.
  // ---------------------------------------------------------------------------

  // Read the sprite index from a tile element's inline background-position.
  function spriteIdx(el) {
    var st = el.getAttribute('style') || '';
    var m = st.match(/background-position:\s*([\d.]+)%\s+([\d.]+)%/);
    if (!m) return null;
    var col = Math.round(parseFloat(m[1]) / 100 * 7);
    var row = Math.round(parseFloat(m[2]) / 100 * 9);
    return row * 8 + col;
  }

  // Resolve a tile's current location from its ancestor space/container id.
  function tileLocation(el) {
    var p = el;
    for (var i = 0; i < 5 && p; i++) {
      var id = p.id || '';
      if (id.indexOf('space_mainboard_') === 0) return 'mainboard';
      if (id.indexOf('_storage_') !== -1) return 'storage';
      if (id.indexOf('_estate_') !== -1) return 'estate';
      if (id === 'discarded_tiles') return 'discardPl';
      if (id.indexOf('discarded_phase') === 0) return 'discard';
      p = p.parentElement;
    }
    return 'other';
  }

  // Remaining = fixed total minus every tile that has left availability
  // (taken to storage, placed on an estate, or discarded). Knowledge tiles are
  // tracked by sprite in privGone so both privilege displays can use them.
  function compute() {
    var all = document.querySelectorAll('.tile_real');
    var gone = {}, privGone = {};
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var loc = tileLocation(el);
      if (loc === 'mainboard' || loc === 'other') continue;
      var c = catOf(spriteIdx(el));
      if (!c) continue;
      if (c.indexOf('priv') === 0) {
        privGone[+c.slice(4)] = true;
        continue;
      }
      gone[c] = (gone[c] || 0) + 1;
    }
    var counts = {};
    ROWS.forEach(function (r) {
      if (r[2] != null) counts[r[0]] = r[2] - (gone[r[0]] || 0);
    });
    return { counts: counts, privGone: privGone };
  }

  var panel, head, bodyEl, toggle;

  function buildPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'cob-counter-panel';
    panel.style.cssText =
      'position:fixed;top:80px;right:20px;z-index:2147483647;' +
      'background:rgba(173,216,230,0.9);border:1px solid #5bb;border-radius:8px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.25);font:14px/1.45 sans-serif;color:#222;' +
      'min-width:200px;user-select:none;';

    head = document.createElement('div');
    head.style.cssText =
      'padding:6px 10px;cursor:move;font-weight:bold;border-bottom:1px solid #7cc;' +
      'background:rgba(91,160,187,0.45);border-radius:8px 8px 0 0;' +
      'display:flex;justify-content:space-between;align-items:center;';
    head.innerHTML =
      '<span>' + t('title') + '</span>' +
      '<span id="cob-counter-toggle" style="font-size:12px;font-weight:normal;">▾ ' + t('collapse') + '</span>';

    bodyEl = document.createElement('div');
    bodyEl.style.cssText = 'padding:8px 10px;max-height:72vh;overflow:auto;';

    panel.appendChild(head);
    panel.appendChild(bodyEl);
    document.body.appendChild(panel);
    toggle = head.querySelector('#cob-counter-toggle');

    // Collapse on header click (ignored when the header was dragged).
    var moved = false;
    head.addEventListener('click', function () {
      if (moved) return;
      var collapsed = bodyEl.style.display === 'none';
      bodyEl.style.display = collapsed ? '' : 'none';
      toggle.textContent = (collapsed ? '▾ ' : '▸ ') + t(collapsed ? 'collapse' : 'expand');
    });

    // Drag by the header.
    var dx = 0, dy = 0, dragging = false;
    head.addEventListener('mousedown', function (e) {
      dragging = true; moved = false;
      var r = panel.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      moved = true;
      panel.style.left = (e.clientX - dx) + 'px';
      panel.style.top = (e.clientY - dy) + 'px';
      panel.style.right = '';
    });
    document.addEventListener('mouseup', function () {
      dragging = false;
      setTimeout(function () { moved = false; }, 0);
    });
  }

  // Build the colored knowledge-tile numbers for the dedicated privilege row.
  function renderPrivNumbers(privGone) {
    return PRIV_NUMBER_ROW.map(function (n) {
      var exists = !privGone[privNumberToSprite(n)];
      return '<span style="display:inline-block;min-width:16px;margin:1px 2px;font-weight:bold;' +
        'color:' + (exists ? GREEN : GRAY) + ';">' + n + '</span>';
    }).join('');
  }

  function render(data) {
    buildPanel();
    if (!data) {
      if (bodyEl._html !== '__wait__') {
        bodyEl._html = '__wait__';
        bodyEl.innerHTML = '<div style="color:#666;font-style:italic;">' + t('wait') + '</div>';
      }
      return;
    }
    var html = '<table style="border-collapse:collapse;width:100%;">';
    ROWS.forEach(function (r) {
      var cat = r[0], labelKey = r[1], total = r[2];
      var valueCell;
      if (cat === '__priv__') {
        valueCell = '<td style="padding:1px 0 1px 8px;text-align:right;max-width:170px;line-height:1.25;">' +
          renderPrivNumbers(data.privGone) + '</td>';
      } else {
        var v = data.counts[cat];
        var cell = '<span style="font-weight:bold;color:' + GREEN + ';">' + v + '/' + total + '</span>';
        // Append the linked-building knowledge marker for the eight buildings.
        if (Object.prototype.hasOwnProperty.call(BUILDING_PRIV, cat)) {
          var sp = BUILDING_PRIV[cat];
          var markExists = !data.privGone[sp];
          cell += '<span style="margin-left:7px;font-weight:bold;color:' +
            (markExists ? GREEN : GRAY) + ';">' + t('privmark') + '</span>';
        }
        valueCell = '<td style="padding:1px 0 1px 8px;text-align:right;white-space:nowrap;">' + cell + '</td>';
      }
      html += '<tr><td style="padding:1px 0;white-space:nowrap;">' + t(labelKey) + '</td>' + valueCell + '</tr>';
    });
    html += '</table>';
    if (bodyEl._html !== html) { bodyEl._html = html; bodyEl.innerHTML = html; }
  }

  // ---------------------------------------------------------------------------
  // Sold-goods breakdown tooltips. The native client only shows the per-type
  // breakdown for the current player; we add the same tooltip for everyone,
  // reusing the game's own HTML builder and CSS so it looks identical.
  // ---------------------------------------------------------------------------
  var soldGoodsMap = {}; // player id -> { goodsType: count }
  var soldTip = null;

  function initSoldGoods() {
    var ui = window.gameui;
    if (!ui || !ui.gamedatas || !ui.gamedatas.players) return;
    for (var pid in ui.gamedatas.players) {
      soldGoodsMap[pid] = {};
      var sg = ui.gamedatas.players[pid].soldGoods || {};
      for (var k in sg) soldGoodsMap[pid][k] = sg[k];
    }
  }

  function buildSoldTip() {
    var old = document.getElementById('cob-sold-tip');
    if (old) old.parentNode.removeChild(old);
    soldTip = document.createElement('div');
    soldTip.id = 'cob-sold-tip';
    soldTip.style.cssText =
      'position:fixed;z-index:2147483647;display:none;pointer-events:none;' +
      'background:#fff;border:1px solid #bbb;border-radius:6px;' +
      'box-shadow:0 2px 10px rgba(0,0,0,0.25);padding:5px;';
    document.body.appendChild(soldTip);
  }

  function showSoldTip(pid, anchor) {
    var ui = window.gameui;
    var map = soldGoodsMap[pid] || {};
    soldTip.innerHTML = ui.buildHtmlSoldGoods(pid, map, 'TT');
    soldTip.style.display = 'block';
    var tw = soldTip.offsetWidth, th = soldTip.offsetHeight;
    var r = anchor.getBoundingClientRect();
    var x = r.left + r.width / 2 - tw / 2;
    var y = r.top - th - 8;
    if (y < 4) y = r.bottom + 8;
    x = Math.max(4, Math.min(x, window.innerWidth - tw - 4));
    soldTip.style.left = x + 'px';
    soldTip.style.top = y + 'px';
  }

  function hideSoldTip() {
    if (soldTip) soldTip.style.display = 'none';
  }

  function bindSoldTooltips() {
    var ui = window.gameui;
    if (!ui) return;
    buildSoldTip();
    // Object.keys + forEach gives each callback its own `pid` binding, so the
    // deferred hover handlers reference the correct player.
    Object.keys(ui.gamedatas.players).forEach(function (pid) {
      if (pid == ui.player_id) return; // self keeps the native tooltip
      ['goods_sold_' + pid, 'goods_sold_number_' + pid].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || el.__soldBound) return;
        el.__soldBound = true;
        el.addEventListener('mouseenter', function () { showSoldTip(pid, el); });
        el.addEventListener('mouseleave', hideSoldTip);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Instant updates: wrap every game notification handler so the panel
  // recomputes as soon as a notification reparents/creates a tile. A short
  // fallback poll covers anything that changes without a wrapped handler.
  // ---------------------------------------------------------------------------
  var NOTIFS = [
    'availableBoards', 'playerEstate', 'startingCastleplaced', 'startingBoardsAndCastles',
    'undoSetupChoices', 'newPhase', 'newRound', 'turnPlayed', 'tileDiscarded',
    'tileTakenToStorage', 'tileAddedToEstate', 'goodsTaken', 'noGoodsTaken',
    'goodsSold', 'workersTaken', 'advantage', 'advantageRefused', 'undoTurn',
    'endOfPhase', 'tileScoring', 'remScoring', 'finalScoring'
  ];

  var queued = false;
  function scheduleUpdate() {
    if (queued) return;
    queued = true;
    var run = function () { queued = false; render(compute()); };
    if (window.requestAnimationFrame) requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  function hookNotifications() {
    var ui = window.gameui;
    if (!ui) return false;
    NOTIFS.forEach(function (name) {
      var fn = ui['notif_' + name];
      if (typeof fn !== 'function' || fn.__wrapped) return;
      var wrapped = function () {
        var r = fn.apply(ui, arguments);
        // Keep the live sold-goods breakdown in sync from the notification args.
        if (name === 'goodsSold') {
          var a = arguments[0] && arguments[0].args;
          if (a && a.plId != null && a.nbAllSoldGoodsPerType) {
            soldGoodsMap[a.plId] = {};
            for (var k in a.nbAllSoldGoodsPerType) soldGoodsMap[a.plId][k] = a.nbAllSoldGoodsPerType[k];
          }
        }
        scheduleUpdate();
        return r;
      };
      wrapped.__wrapped = true;
      ui['notif_' + name] = wrapped;
    });
    return true;
  }

  function start() {
    render(compute());
    initSoldGoods();
    bindSoldTooltips();
    // Hook as soon as gameui exists; retry briefly if it is not ready yet.
    if (!hookNotifications()) {
      var tries = 0;
      var timer = setInterval(function () {
        if (hookNotifications()) {
          initSoldGoods(); bindSoldTooltips(); clearInterval(timer);
        } else if (++tries > 20) clearInterval(timer);
      }, 200);
    }
    // Safety net for any change not routed through a wrapped handler.
    setInterval(function () { render(compute()); }, 1000);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
