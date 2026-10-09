/* Grok Pickleball - menus, panels, HUD text */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U;
  const $ = (id) => document.getElementById(id);
  const UI = PB.UI = {};
  const G = () => PB.G;
  const esc = U.esc;
  UI.$ = $;
  UI.toast = function (t, bad) { const d = document.createElement('div'); d.className = 'toast' + (bad ? ' bad' : ''); d.textContent = t; $('toasts').appendChild(d); UI.lastToast = t; setTimeout(() => d.remove(), 2800); while ($('toasts').children.length > 3) $('toasts').firstChild.remove(); };
  let msgT = 0, hintT = 0, callT = 0;
  UI.msg = function (big, small, dur) { const m = $('msg'); m.innerHTML = esc(big) + (small ? '<small>' + esc(small) + '</small>' : ''); m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('show'), dur || 1500); UI.lastMsg = big + (small ? ' | ' + small : ''); };
  UI.hint = function (t, dur) { const h = $('hint'); $('swipeHelp').style.opacity = 0; clearTimeout(UI._shT); UI._shT = setTimeout(() => { $('swipeHelp').style.opacity = 1; }, (dur || 1800) + 200); if (h.textContent === t && h.classList.contains('show')) { clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), dur || 1800); return; } h.textContent = t; h.classList.add('show'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('show'), dur || 1800); UI.lastHint = t; };
  UI.call = function (t, sub) { const c = $('call'); c.innerHTML = esc(t) + (sub ? '<small>' + esc(sub) + '</small>' : ''); c.classList.add('show'); clearTimeout(callT); callT = setTimeout(() => c.classList.remove('show'), 1400); UI.lastCall = t; };
  UI.perfect = function (t) { const p = $('perfect'); p.textContent = t; p.classList.remove('show'); void p.offsetWidth; p.classList.add('show'); };
  UI.show = (id, on) => $(id).classList.toggle('hidden', !on);
  UI.panel = function (html, bind, opts) {
    const p = $('pnl'), c = $('pnlCard'); c.className = 'card' + (opts && opts.cls ? ' ' + opts.cls : ''); p.className = 'screen top' + (opts && opts.locker ? ' lockerMode' : '');
    c.innerHTML = html; p.classList.remove('hidden'); UI.open = opts && opts.name || 'panel';
    c.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { PB.Snd.fx('ui'); UI.close(); if (opts && opts.onClose) opts.onClose(); }));
    c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => PB.Snd.fx('ui')));
    if (bind) bind(c); c.scrollTop = 0;
  };
  UI.close = function () { $('pnl').classList.add('hidden'); UI.open = null; if (G().onPanelClose) { const f = G().onPanelClose; G().onPanelClose = null; f(); } };
  UI.seg = function (c, id, val, cb) { const el = c.querySelector('#' + id); el.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b.dataset.v === String(val)); b.addEventListener('click', () => { if (b.classList.contains('lock') && cb(b.dataset.v, true) === false) return; el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); cb(b.dataset.v); }); }); };
  const segH = (id, items) => '<div class="seg" id="' + id + '">' + items.map((i) => '<button type="button" data-v="' + i[0] + '"' + (i[2] ? ' class="lock"' : '') + '>' + i[1] + '</button>').join('') + '</div>';
  UI.segH = segH;
  const tog = (id, on) => '<button type="button" class="tog' + (on ? ' on' : '') + '" id="' + id + '" aria-label="toggle"></button>';
  UI.togBind = (c, id, cb) => { const b = c.querySelector('#' + id); b.addEventListener('click', () => { b.classList.toggle('on'); cb(b.classList.contains('on')); }); };

  /* ---------- rules / how to play ---------- */
  UI.rules = function () {
    UI.panel('<h2>❓ HOW TO PLAY</h2><ul class="help">' +
      '<li><b>Controls:</b> your player runs to the ball for you (Assist). <b>Swipe up</b> to hit: swipe left/right to aim, a short swipe is soft, a long swipe is hard. <b>Tap</b> for an automatic smart shot, or use the <b>DINK / DRIVE / LOB / SMASH</b> buttons.</li>' +
      '<li><b>Serve</b> underhand from behind the baseline, diagonally into the box across the net. It must land past the kitchen line.</li>' +
      '<li><b>Two-bounce rule:</b> the serve must bounce, and the return must bounce too. After that you can volley (hit it in the air).</li>' +
      '<li><b>The Kitchen</b> is the zone next to the net. You can never volley while standing in it (or on its line), and you can\u2019t step in right after a volley. Once the ball bounces in the kitchen you can go in and hit it.</li>' +
      '<li><b>Scoring (side-out):</b> only the serving side scores. In doubles the score is called as <b>your score - their score - server number</b>, like "4 - 2 - 1". Games go to 11, win by 2. You can switch to rally scoring in the match setup.</li>' +
      '<li><b>Faults:</b> hitting it out, into the net, volleying in the kitchen or breaking the two-bounce rule loses the rally.</li>' +
      '<li><b>Desktop:</b> drag the mouse up to swipe, click to tap, WASD/arrows to move, Space = auto shot, J K L I = dink drive lob smash, T = taunt, Esc = pause.</li></ul>' +
      '<div class="btnrow"><button class="btn primary" data-close>GOT IT</button></div>');
  };

  /* ---------- settings (also from pause) ---------- */
  UI.settings = function (inMatch) {
    const g = G(), o = g.save.opts, S = PB.Snd;
    UI.panel('<h2>⚙️ SETTINGS</h2>' +
      '<div class="opt"><div>🛟 Assist Mode<small>Auto-move to the ball, landing spot, aim help, kitchen warnings, slower CPU reactions. Off = full manual (joystick).</small></div>' + tog('tAssist', o.assist) + '</div>' +
      '<div class="opt"><div>✨ Graphics<small>High looks best. Low runs smoother on older phones.</small></div>' + segH('sGfx', [['high', 'HIGH'], ['low', 'LOW']]) + '</div>' +
      '<div class="opt"><div>🎯 Show landing spot<small>Yellow ring where the ball will bounce (Assist).</small></div>' + tog('tLand', o.land !== false) + '</div>' +
      '<div class="opt"><div>🔊 Sound</div>' + tog('tSnd', S.on) + '</div>' +
      '<div class="opt"><div>🎵 Music</div>' + tog('tMus', S.music) + '</div>' +
      '<div class="opt"><div>🗣️ Voice score calls</div>' + tog('tVoice', S.voice) + '</div>' +
      '<div class="opt"><div>📳 Camera shake on smashes</div>' + tog('tShake', o.shake !== false) + '</div>' +
      (inMatch ? '' : '<div class="btnrow"><button class="btn red small" id="bReset">RESET SAVE</button></div>') +
      '<div class="btnrow"><button class="btn primary" data-close>DONE</button></div>', (c) => {
      UI.togBind(c, 'tAssist', (v) => { g.setAssist(v); });
      UI.seg(c, 'sGfx', g.gfx, (v) => g.setGfx(v, true));
      UI.togBind(c, 'tLand', (v) => { o.land = v; g.persist(); });
      UI.togBind(c, 'tSnd', (v) => { S.on = v; S.save(); });
      UI.togBind(c, 'tMus', (v) => { S.music = v; S.save(); });
      UI.togBind(c, 'tVoice', (v) => { S.voice = v; S.save(); });
      UI.togBind(c, 'tShake', (v) => { o.shake = v; g.persist(); });
      const r = c.querySelector('#bReset'); if (r) r.addEventListener('click', () => { if (confirm('Erase all coins, unlocks and progress?')) { g.resetSave(); UI.close(); } });
    }, { onClose: inMatch ? () => g.pauseMenu() : null });
  };

  /* ---------- quick match ---------- */
  UI.quick = function () {
    const g = G(), o = g.save.opts, owned = g.save.owned.courts;
    UI.panel('<h2>🏓 QUICK MATCH</h2>' +
      '<h3>MODE</h3>' + segH('sMode', [['singles', '👤 SINGLES'], ['doubles', '👥 DOUBLES']]) +
      '<h3>CPU LEVEL</h3>' + segH('sDiff', D.DIFF_ORDER.map((k) => [k, D.DIFF[k].n.toUpperCase()])) +
      '<h3>COURT</h3>' + segH('sCourt', D.COURTS.map((c) => [c.id, c.icon + ' ' + c.n + (owned.indexOf(c.id) < 0 ? ' 🔒' : ''), owned.indexOf(c.id) < 0])) +
      '<h3>SCORING</h3>' + segH('sScore', [['sideout', 'SIDE-OUT (official)'], ['rally', 'RALLY (every point counts)']]) +
      segH('sTo', [['7', 'TO 7'], ['11', 'TO 11'], ['15', 'TO 15']]) +
      '<div class="btnrow"><button class="btn alt" data-close>BACK</button><button class="btn primary big" id="bGo">PLAY!</button></div>', (c) => {
      UI.seg(c, 'sMode', o.mode, (v) => { o.mode = v; });
      UI.seg(c, 'sDiff', o.diff, (v) => { o.diff = v; });
      UI.seg(c, 'sCourt', o.court, (v, lock) => { if (lock) { UI.toast('🔒 Unlock this court in the Locker or the Pickle Cup!', true); return false; } o.court = v; g.previewCourt(v); });
      UI.seg(c, 'sScore', o.scoring, (v) => { o.scoring = v; });
      UI.seg(c, 'sTo', String(o.to), (v) => { o.to = +v; });
      c.querySelector('#bGo').addEventListener('click', () => { g.persist(); UI.close(); g.startQuick(); });
    });
  };

  /* ---------- Pickle Cup (career ladder) ---------- */
  UI.career = function () {
    const g = G(), done = g.save.career.beaten;
    UI.panel('<h2>🏆 THE PICKLE CUP</h2><p class="sub">Beat all 8 players to become champion! Each one has their own style. Winning unlocks their court.</p><div class="list ladder">' +
      D.LADDER.map((o, i) => { const st = i < done ? '✅' : i === done ? '▶️' : '🔒'; const c = D.court(o.court); return '<div class="item' + (i === done ? ' on' : i > done ? ' lock' : '') + '"><div class="ic">' + st + '</div><div class="grow"><b>' + (i + 1) + '. ' + esc(o.n) + ' <span>' + D.DIFF[o.diff].n + '</span></b><small>' + c.icon + ' ' + esc(c.n) + ' · 🪙 ' + o.reward + '</small></div>' + (i <= done ? '<button class="btn ' + (i === done ? 'primary' : 'alt') + '" data-i="' + i + '">' + (i === done ? 'PLAY' : 'REMATCH') + '</button>' : '') + '</div>'; }).join('') +
      '</div><div class="btnrow"><button class="btn alt" data-close>BACK</button></div>', (c) => {
      c.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { const o = D.LADDER[+b.dataset.i]; UI.vs(o, +b.dataset.i); }));
    });
  };
  UI.vs = function (o, i) {
    const c = D.court(o.court);
    UI.panel('<h2>' + (o.boss ? '👑 FINAL' : 'MATCH ' + (i + 1)) + '</h2><div class="big1">VS</div><h3>' + esc(o.n) + '</h3><p class="sub">“' + esc(o.intro) + '”</p><p class="sub">' + c.icon + ' ' + esc(c.n) + ' · ' + D.DIFF[o.diff].n + ' · to 11, side-out</p>' +
      '<div class="btnrow"><button class="btn alt" data-close>BACK</button><button class="btn primary big" id="bGo">LET\u2019S PLAY!</button></div>', (cc) => { cc.querySelector('#bGo').addEventListener('click', () => { UI.close(); G().startCareer(i); }); });
  };

  /* ---------- mini games ---------- */
  UI.minis = function () {
    const g = G(), best = g.save.best;
    UI.panel('<h2>🎯 MINI GAMES</h2><p class="sub">Practice skills and earn coins!</p><div class="list">' +
      PB.Modes.MINIS.map((m) => '<div class="item"><div class="ic">' + m.icon + '</div><div class="grow"><b>' + esc(m.n) + '</b><small>' + esc(m.desc) + '<br>Best: ' + (best[m.id] || 0) + '</small></div><button class="btn primary" data-m="' + m.id + '">GO</button></div>').join('') +
      '</div><div class="btnrow"><button class="btn alt" data-close>BACK</button></div>', (c) => {
      c.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { UI.close(); PB.Modes.startMini(b.dataset.m); }));
    });
  };

  /* ---------- locker / shop ---------- */
  UI.locker = function (tab) {
    const g = G(), sv = g.save; tab = tab || 'paddles';
    const tabs = [['paddles', '🏓 Paddles'], ['outfits', '👕 Outfits'], ['look', '🙂 Look'], ['celebs', '🎉 Moves'], ['taunts', '💬 Taunts'], ['courts', '🏟️ Courts']];
    let body = '';
    const row = (kind, it, icon, name, sub) => { const own = sv.owned[kind].indexOf(it.id) >= 0, on = sv.eq[kind] === it.id; return '<div class="item' + (on ? ' on' : '') + '"><div class="ic">' + icon + '</div><div class="grow"><b>' + esc(name) + '</b><small>' + (sub || '') + '</small></div>' + (own ? (on ? '<span class="badge">EQUIPPED</span>' : '<button class="btn green" data-eq="' + kind + ':' + it.id + '">USE</button>') : '<button class="btn gold" data-buy="' + kind + ':' + it.id + '">🪙 ' + it.price + '</button>') + '</div>'; };
    if (tab === 'paddles') body = D.PADDLES.map((p) => row('paddles', p, '<span class="sw" style="background:linear-gradient(135deg,' + p.a + ' 55%,' + p.b + ' 56%)"></span>', p.n, p.glow ? '✨ glows' : p.pickle ? '🥒 pickle shaped' : '')).join('');
    else if (tab === 'outfits') body = D.OUTFITS.map((o) => row('outfits', o, '<span class="sw" style="background:linear-gradient(180deg,' + (o.shirt || sv.look.shirt) + ' 60%,' + o.shorts + ' 61%)"></span>', o.n, 'Hat: ' + o.hat)).join('');
    else if (tab === 'celebs') body = D.CELEBS.map((o) => row('celebs', o, o.icon, o.n, 'Plays when you win a point')).join('');
    else if (tab === 'taunts') body = D.TAUNTS.map((o) => row('taunts', o, '💬', o.t, '')).join('');
    else if (tab === 'courts') body = D.COURTS.map((o) => row('courts', o, o.icon, o.n, o.desc)).join('');
    else body = '<h3>SKIN</h3><div class="swatches" id="lkSkin">' + D.SKINS.map((s, i) => '<button style="background:' + s + '" data-v="' + i + '" class="' + (sv.look.skin === i ? 'on' : '') + '"></button>').join('') + '</div>' +
      '<h3>HAIR</h3><div class="swatches" id="lkHair">' + ['#2d1b0e', '#5b3a1e', '#a0522d', '#f6c344', '#111827', '#e5e7eb', '#ff4fd8', '#3b82f6'].map((s) => '<button style="background:' + s + '" data-v="' + s + '" class="' + (sv.look.hair === s ? 'on' : '') + '"></button>').join('') + '</div>' +
      '<h3>HAIR STYLE</h3>' + segH('lkStyle', [['short', 'SHORT'], ['pony', 'PONYTAIL'], ['bun', 'BUN'], ['long', 'LONG']]) +
      '<h3>SHIRT (Starter Tee)</h3><div class="swatches" id="lkShirt">' + D.SHIRTS.map((s) => '<button style="background:' + s + '" data-v="' + s + '" class="' + (sv.look.shirt === s ? 'on' : '') + '"></button>').join('') + '</div>';
    UI.panel('<h2>🎒 LOCKER <span class="coins">🪙 <b>' + sv.coins + '</b></span></h2><div class="tabs">' + tabs.map((t) => '<button type="button" data-t="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div><div class="list">' + body + '</div><div class="btnrow"><button class="btn primary" data-close>DONE</button></div>', (c) => {
      c.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => UI.locker(b.dataset.t)));
      c.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => { const [k, id] = b.dataset.eq.split(':'); g.equip(k, id); UI.locker(tab); }));
      c.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => { const [k, id] = b.dataset.buy.split(':'); if (g.buy(k, id)) UI.locker(tab); }));
      const sw = (id, key, num) => { const el = c.querySelector('#' + id); if (!el) return; el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { sv.look[key] = num ? +b.dataset.v : b.dataset.v; g.persist(); g.refreshLocker(); UI.locker(tab); })); };
      sw('lkSkin', 'skin', true); sw('lkHair', 'hair'); sw('lkShirt', 'shirt');
      if (c.querySelector('#lkStyle')) UI.seg(c, 'lkStyle', sv.look.style || 'short', (v) => { sv.look.style = v; g.persist(); g.refreshLocker(); });
    }, { cls: 'locker', locker: true, name: 'locker', onClose: () => g.toTitle() });
  };

  /* ---------- pause + results ---------- */
  UI.pause = function () {
    const g = G(), o = g.save.opts;
    UI.panel('<h2>⏸️ PAUSED</h2>' +
      '<div class="opt"><div>🛟 Assist Mode<small>Auto-move, landing spot, aim help, kitchen warnings</small></div>' + tog('tAssist', o.assist) + '</div>' +
      '<div class="opt"><div>✨ Graphics</div>' + segH('sGfx', [['high', 'HIGH'], ['low', 'LOW']]) + '</div>' +
      '<div class="btncol" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"><button class="btn primary" id="bRes">▶️ RESUME</button><button class="btn alt small" id="bSet">⚙️ MORE SETTINGS</button><button class="btn alt small" id="bRul">❓ RULES</button><button class="btn red small" id="bQuit">🚪 QUIT MATCH</button></div>', (c) => {
      UI.togBind(c, 'tAssist', (v) => g.setAssist(v));
      UI.seg(c, 'sGfx', g.gfx, (v) => g.setGfx(v, true));
      c.querySelector('#bRes').addEventListener('click', () => { UI.close(); g.resume(); });
      c.querySelector('#bSet').addEventListener('click', () => UI.settings(true));
      c.querySelector('#bRul').addEventListener('click', () => { UI.rules(); g.onPanelClose = () => g.pauseMenu(); });
      c.querySelector('#bQuit').addEventListener('click', () => { UI.close(); g.quit(); });
    }, { name: 'pause' });
  };
  UI.results = function (r) {
    const g = G();
    UI.panel('<h2>' + (r.win ? '🏆 YOU WIN!' : '😅 NICE TRY!') + '</h2><div class="score1">' + r.score.join(' - ') + '</div>' +
      (r.line ? '<p class="sub">' + esc(r.line) + '</p>' : '') +
      '<p class="sub">🪙 +' + r.coins + ' coins' + (r.unlock ? '<br>🔓 ' + esc(r.unlock) : '') + '</p>' +
      '<p class="sub">Winners: ' + r.stats.winners + ' · Errors: ' + r.stats.errors + ' · Longest rally: ' + r.longest + ' hits</p>' +
      '<div class="btnrow">' + (r.replay ? '<button class="btn gold small" id="bRep">⭐ WATCH BEST POINT</button>' : '') + '</div>' +
      '<div class="btnrow"><button class="btn alt" id="bMenu">MENU</button>' + (r.next ? '<button class="btn primary" id="bNext">NEXT MATCH ▶️</button>' : '<button class="btn primary" id="bAgain">PLAY AGAIN</button>') + '</div>', (c) => {
      c.querySelector('#bMenu').addEventListener('click', () => { UI.close(); g.toTitle(); });
      const a = c.querySelector('#bAgain'); if (a) a.addEventListener('click', () => { UI.close(); g.again(); });
      const n = c.querySelector('#bNext'); if (n) n.addEventListener('click', () => { UI.close(); UI.vs(D.LADDER[r.next], r.next); });
      const rp = c.querySelector('#bRep'); if (rp) rp.addEventListener('click', () => { UI.close(); g.playReplay(r.replay, () => UI.results(r)); });
    }, { name: 'results' });
  };

  /* ---------- HUD scoreboard ---------- */
  UI.board = function (st, names, me) {
    const g = st.game; if (!g) return;
    $('sc0').textContent = g.score[0]; $('sc1').textContent = g.score[1];
    const shortN = (n) => { const w = String(n).replace(/^CPU\s+/i, '').replace(/[’']/g, '').split(/\s+/); const a = w[0] || n; return a.length > 8 ? a.slice(0, 7) + '.' : a; };
    [0, 1].forEach((i) => { const el = $('nm' + i), parts = String(names[i] || '').split(' + '); el.classList.toggle('two', parts.length > 1); if (parts.length > 1) el.innerHTML = parts.map((q) => U.esc(shortN(q))).join('<br>'); else el.textContent = String(names[i] || '').length > 12 ? shortN(names[i]) : names[i]; });
    const dots = g.doubles && g.scoring === 'sideout' ? g.sn : 1;
    $('sv0').innerHTML = g.st === 0 ? '<i></i>'.repeat(dots) : ''; $('sv1').innerHTML = g.st === 1 ? '<i></i>'.repeat(dots) : '';
    $('scoring').textContent = (g.scoring === 'rally' ? 'RALLY' : 'SIDE-OUT') + ' · TO ' + g.to;
    void me;
  };
})();
