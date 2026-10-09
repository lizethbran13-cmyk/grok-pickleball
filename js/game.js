/* Grok Pickleball - main: boot, save, match flow, input, HUD, replays, quality, test hooks */
(function () {
  'use strict';
  const PB = window.PB, U = PB.U, D = PB.D, V = PB.V, UI = PB.UI, Snd = PB.Snd, R = PB.Rules, Ph = PB.Phys, GN = window.GrokNet;
  const $ = (id) => document.getElementById(id);
  const G = PB.G = { ready: false, playing: false, paused: false, m: null, me: 0, side: 0, t: 0, ctrl: null, bubbles: [], names: ['YOU', 'CPU'] };
  const KEY = 'grokPickleball.save.v1';

  /* ---------- save ---------- */
  function defSave() { return { v: 1, coins: 100, owned: { paddles: ['classic'], outfits: ['starter'], celebs: ['fist', 'jump'], taunts: ['wave', 'cool', 'gg', 'oops'], courts: ['park', 'gym'] }, eq: { paddles: 'classic', outfits: 'starter', celebs: 'fist', taunts: 'wave', courts: 'park' },
    look: { skin: 0, hair: '#5b3a1e', shirt: '#3b82f6', style: 'short' }, opts: { assist: true, diff: 'easy', scoring: 'sideout', to: 11, mode: 'singles', court: 'park', shake: true, land: true },
    career: { beaten: 0 }, best: {}, stats: { matches: 0, wins: 0, points: 0, longest: 0 }, tutorialDone: false }; }
  function load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    const d = defSave(); if (!s || typeof s !== 'object') return d;
    for (const k in d) if (s[k] == null || typeof s[k] !== typeof d[k] || Array.isArray(d[k]) !== Array.isArray(s[k])) s[k] = d[k];
    for (const k in d.owned) { if (!Array.isArray(s.owned[k])) s.owned[k] = d.owned[k]; d.owned[k].forEach((id) => { if (s.owned[k].indexOf(id) < 0) s.owned[k].push(id); }); }
    for (const k in d.eq) if (typeof s.eq[k] !== 'string' || s.owned[k].indexOf(s.eq[k]) < 0) s.eq[k] = d.eq[k];
    for (const k in d.opts) if (s.opts[k] == null) s.opts[k] = d.opts[k];
    if (!D.DIFF[s.opts.diff]) s.opts.diff = 'easy'; if (s.owned.courts.indexOf(s.opts.court) < 0) s.opts.court = 'park';
    s.coins = Math.max(0, Math.floor(+s.coins || 0)); s.career.beaten = U.clamp(s.career.beaten | 0, 0, D.LADDER.length);
    return s;
  }
  G.save = load();
  G.persist = function () { try { localStorage.setItem(KEY, JSON.stringify(G.save)); } catch (e) {} const n = $('coinN'); if (n) n.textContent = G.save.coins; };
  G.resetSave = function () { G.save = defSave(); G.persist(); UI.toast('Save reset. Fresh start! 🥒'); G.toTitle(); };
  G.addCoins = function (n) { G.save.coins += Math.max(0, Math.round(n)); G.persist(); };
  G.gfx = localStorage.getItem('grokPickleball.gfx') || 'high'; G.gfxUser = !!localStorage.getItem('grokPickleball.gfx');
  G.myName = () => GN.cleanName(($('nameIn').value || GN.savedProfile().name || 'You'));
  G.myColor = () => GN.cleanColor(GN.savedProfile().color);

  /* ---------- looks ---------- */
  G.myLook = function () {
    const s = G.save, o = D.OUTFITS.find((x) => x.id === s.eq.outfits) || D.OUTFITS[0], st = s.look.style;
    return { shirt: o.shirt || s.look.shirt, shorts: o.shorts, hat: o.hat, hatCol: o.hat === 'cap' ? M2(o.shirt || s.look.shirt) : (o.id === 'pro' ? '#1e40af' : o.id === 'sweat' ? '#ffffff' : '#fde047'), skin: s.look.skin, hair: s.look.hair, pony: st === 'pony', bun: st === 'bun', long: st === 'long',
      paddle: D.PADDLES.find((p) => p.id === s.eq.paddles) || D.PADDLES[0], celeb: s.eq.celebs, band: '#ffffff' };
  };
  const M2 = (c) => PB.M.darker(c, 0.05);
  G.aiLook = function (seed, ladder) {
    if (ladder) { const l = ladder.look; return { shirt: l.shirt, shorts: '#1f2937', hat: l.hat === 'none' ? null : l.hat, hatCol: l.shirt, skin: l.skin, hair: l.hair, glasses: l.glasses, paddle: D.PADDLES[(ladder.n.length) % D.PADDLES.length], celeb: ladder.boss ? 'bow' : 'jump', bald: l.hair === '#e5e7eb' ? false : false, bun: ladder.id === 'gert', pony: ladder.id === 'dana' || ladder.id === 'sasha' }; }
    const r = U.rng(seed * 31 + 7), sh = D.SHIRTS[Math.floor(r() * D.SHIRTS.length)];
    return { shirt: sh, shorts: ['#1f2937', '#ffffff', '#334155'][Math.floor(r() * 3)], hat: ['cap', 'visor', 'headband', null, 'bucket'][Math.floor(r() * 5)], hatCol: sh, skin: Math.floor(r() * 5), hair: ['#2d1b0e', '#5b3a1e', '#a0522d', '#f6c344', '#111827'][Math.floor(r() * 5)], pony: r() < 0.3, glasses: r() < 0.2, paddle: D.PADDLES[Math.floor(r() * D.PADDLES.length)], celeb: ['fist', 'jump', 'spin', 'dance'][Math.floor(r() * 4)] };
  };

  /* ---------- boot ---------- */
  G.init = function () {
    V.init($('c')); V.setQuality(G.gfx);
    const prof = GN.savedProfile(); $('nameIn').value = prof.hasName ? prof.name : '';
    const cr = $('colorRow'); GN.COLORS.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = c; if (c === prof.color) b.classList.add('on'); b.addEventListener('click', () => { GN.saveProfile(G.myName(), c); G.save.look.shirt = c; G.persist(); cr.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); Snd.fx('ui'); }); cr.appendChild(b); });
    $('nameIn').addEventListener('change', () => GN.saveProfile(G.myName(), G.myColor()));
    const go = (id, fn) => $(id).addEventListener('click', () => { Snd.unlock(); Snd.fx('ui'); GN.saveProfile(G.myName(), G.myColor()); fn(); });
    go('bQuick', () => UI.quick()); go('bCareer', () => UI.career()); go('bMini', () => UI.minis()); go('bOnline', () => PB.Net.lobby()); go('bTut', () => PB.Modes.startTutorial()); go('bShop', () => G.openLocker()); go('bSettings', () => UI.settings()); go('bHow', () => UI.rules());
    $('bPause').addEventListener('click', () => { Snd.fx('ui'); G.pauseMenu(); });
    $('bTaunt').addEventListener('click', () => { Snd.fx('ui'); G.toggleTaunts(); });
    document.querySelectorAll('.shot').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); Snd.unlock(); G.shot(b.dataset.s, 0, 0.6); }));
    $('replayBar').addEventListener('click', () => G.skipReplay());
    document.addEventListener('pointerdown', () => Snd.unlock(), { once: false, passive: true });
    setupInput();
    G.persist();
    G.toTitle();
    G.ready = true; G.last = performance.now(); requestAnimationFrame(loop);
    if (GN.params()) PB.Net.fromParams(GN.params());
  };

  /* ---------- menu background: an AI demo match ---------- */
  G.startDemo = function (court) {
    const looks = [0, 1, 2, 3].map((i) => G.aiLook(i + 11)); looks[0] = G.myLook();
    G.demo = new PB.Match({ doubles: true, players: looks.map((l, i) => ({ ctrl: 'ai', diff: i % 2 ? 'hard' : 'medium', look: l })), seed: (Math.random() * 1e6) | 0 });
    V.setCourt(court || G.save.opts.court); V.setPlayers(looks); Snd.setMusic('menu');
  };
  G.previewCourt = function (id) { if (!G.playing) { V.setCourt(id); } };
  G.toTitle = function () {
    G.playing = false; G.paused = false; G.m = null; G.ctrl = null; G.replay = null; G.mirror = null; UI.show('hud', false); UI.show('scrTitle', true); $('drill').classList.add('hidden'); clearBubbles();
    if (PB.Net.room && !PB.Net.inLobby) PB.Net.leave();
    G.locker = false; G.startDemo(); G.persist();
  };
  G.openLocker = function () { UI.show('scrTitle', false); G.locker = true; G.refreshLocker(); UI.locker(); };
  G.refreshLocker = function () { V.setPlayers([G.myLook()]); G.lockT = 0; };

  /* ---------- shop ---------- */
  const shopList = { paddles: D.PADDLES, outfits: D.OUTFITS, celebs: D.CELEBS, taunts: D.TAUNTS, courts: D.COURTS };
  G.buy = function (kind, id) {
    const it = shopList[kind].find((x) => x.id === id); const s = G.save; if (!it || s.owned[kind].indexOf(id) >= 0) return false;
    if (s.coins < it.price) { UI.toast('Not enough coins yet - win matches and mini games! 🪙', true); Snd.fx('bad'); return false; }
    s.coins -= it.price; s.owned[kind].push(id); s.eq[kind] = id; G.persist(); Snd.fx('buy'); UI.toast('Unlocked ' + (it.n || it.t) + '! 🎉'); if (kind === 'courts') G.save.opts.court = id; G.refreshLocker(); if (kind === 'courts') V.setCourt(id); return true;
  };
  G.equip = function (kind, id) { const s = G.save; if (s.owned[kind].indexOf(id) < 0) return; s.eq[kind] = id; if (kind === 'courts') { s.opts.court = id; V.setCourt(id); } G.persist(); G.refreshLocker(); if (kind === 'celebs') G.lockCeleb = 1.6; };

  /* ---------- starting matches ---------- */
  G.looksFor = function (m) { return m.players.map((p) => p.look); };
  G.begin = function (m, court, names, opts) {
    opts = opts || {}; G.curLooks = opts.looks || null;
    G.m = m; G.court = court; G.names = names; G.playing = true; G.paused = false; G.replay = null; G.pendingReplay = null; G.bestClip = null; G.longest = 0; G.ctrl = opts.ctrl || null; G.kind = opts.kind || 'quick'; G.cfg = opts.cfg || {}; G.me = opts.me || 0; G.side = R.teamOfPlayer(m.game, G.me); G.isGuest = !!opts.guest;
    UI.show('scrTitle', false); UI.close(); UI.show('hud', true); clearBubbles();
    V.setCourt(court); V.setPlayers(opts.looks || G.looksFor(m)); V.playCam(0, 0, G.side, 0, true);
    G.applyAssistUI(); Snd.setMusic(court); G.lastFrameT = 0;
    $('drill').classList.toggle('hidden', !opts.drill); $('shots').classList.toggle('hidden', !!opts.noShots); $('bTaunt').classList.toggle('hidden', !!opts.drill);
    $('board').classList.toggle('hidden', !!opts.drill);
    UI.board(m, names, G.me); V.setBoard(m.game.score[0], m.game.score[1], names[0], names[1]);
    G.fpsAcc = 0; G.fpsN = 0; G.fpsLow = 0;
  };
  G.startQuick = function (cfg) {
    const o = G.save.opts; cfg = cfg || { doubles: o.mode === 'doubles', diff: o.diff, court: o.court, scoring: o.scoring, to: o.to };
    const me = { ctrl: 'human', name: G.myName(), assist: o.assist, look: G.myLook() };
    const players = [me];
    const nm = (i) => D.AI_NAMES[(i + Math.floor(Math.random() * 8)) % D.AI_NAMES.length];
    if (cfg.doubles) players.push({ ctrl: 'ai', diff: cfg.diff === 'easy' ? 'medium' : cfg.diff, name: nm(1), look: G.aiLook(2) });
    const opp = cfg.doubles ? [0, 1] : [0]; opp.forEach((k) => players.push({ ctrl: 'ai', diff: cfg.diff, name: nm(k + 3), look: G.aiLook(k + 5 + Math.floor(Math.random() * 50)) }));
    const m = new PB.Match({ doubles: cfg.doubles, scoring: cfg.scoring, to: cfg.to, players, slowAI: o.assist, firstServe: Math.random() < 0.5 ? 0 : 1 });
    G.begin(m, cfg.court, [cfg.doubles ? 'YOU + ' + players[1].name : G.myName(), cfg.doubles ? players[2].name + ' + ' + players[3].name : players[1].name], { kind: 'quick', cfg });
  };
  G.startCareer = function (i) {
    const L = D.LADDER[i], o = G.save.opts;
    const players = [{ ctrl: 'human', name: G.myName(), assist: o.assist, look: G.myLook() }, { ctrl: 'ai', diff: L.diff, style: L.style, name: L.n, look: G.aiLook(0, L) }];
    const m = new PB.Match({ doubles: false, scoring: 'sideout', to: 11, players, slowAI: o.assist, firstServe: 0 });
    G.begin(m, L.court, [G.myName(), L.n], { kind: 'career', cfg: { ladder: i } });
    setTimeout(() => G.bubble(1, L.intro, 3.2), 600);
  };
  G.again = function () { if (G.kind === 'career') G.startCareer(G.cfg.ladder); else if (G.kind === 'online') PB.Net.rematch(); else G.startQuick(G.cfg); };
  G.quit = function () { if (G.kind === 'online') PB.Net.leave(); G.toTitle(); };

  /* ---------- assist / graphics ---------- */
  G.setAssist = function (v) { G.save.opts.assist = !!v; G.persist(); if (G.m && G.m.players[G.me]) { G.m.players[G.me].assist = !!v; G.m.slowAI = G.m.players.some((p) => p.ctrl === 'human' && p.assist); } if (G.isGuest) PB.Net.sendAssist(!!v); G.applyAssistUI(); };
  G.applyAssistUI = function () { const a = G.save.opts.assist; $('assistTag').textContent = a ? '🛟 ASSIST ON' : '🎮 MANUAL'; $('assistTag').classList.toggle('off', !a); $('joy').classList.toggle('hidden', a); $('swipeHelp').textContent = a ? 'SWIPE UP to hit · TAP = auto shot' : 'JOYSTICK to move · SWIPE UP to hit'; };
  G.setGfx = function (v, user) {
    if (v !== 'high' && v !== 'low') return; G.gfx = v; if (user) { G.gfxUser = true; try { localStorage.setItem('grokPickleball.gfx', v); } catch (e) {} }
    V.setQuality(v); const id = V.envName; V.court && (V.court.userData.q = '?'); if (id) V.setCourt(id);
    if (G.playing && G.m) V.setPlayers(G.curLooks || G.looksFor(G.m)); else if (G.demo && !G.locker) V.setPlayers(G.demo.players.map((p) => p.look)); else if (G.locker) G.refreshLocker();
  };

  /* ---------- pause ---------- */
  G.pauseMenu = function () { if (!G.playing) return; if (G.kind !== 'online') G.paused = true; UI.pause(); };
  G.resume = function () { G.paused = false; };

  /* ---------- taunts / bubbles ---------- */
  G.toggleTaunts = function () { const t = $('taunts'); if (!t.classList.contains('hidden')) { t.classList.add('hidden'); return; } t.innerHTML = G.save.owned.taunts.map((id) => { const x = D.TAUNTS.find((q) => q.id === id); return x ? '<button type="button" data-t="' + id + '">' + U.esc(x.t) + '</button>' : ''; }).join(''); t.classList.remove('hidden');
    t.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const x = D.TAUNTS.find((q) => q.id === b.dataset.t); t.classList.add('hidden'); G.taunt(x.t); })); };
  G.taunt = function (text) {
    G.bubble(G.me, text, 2.2); if (PB.Net.room && G.kind === 'online') PB.Net.sendEmote(G.me, text);
    if (G.kind !== 'online' && Math.random() < 0.7) { const opp = G.m.players.find((p) => p.team !== G.side); const L = G.kind === 'career' ? D.LADDER[G.cfg.ladder] : null; const lines = L ? [L.win, '😤 Bring it!', '😏 We\u2019ll see!'] : ['😤 Bring it!', '😏 We\u2019ll see!', '🥒 Pickle power!', '😂 Nice one!']; setTimeout(() => G.bubble(opp.i, U.pick(lines), 2.2), 900); }
  };
  G.bubble = function (i, text, dur) { const el = document.createElement('div'); el.className = 'bub'; el.textContent = text; $('bubbles').appendChild(el); G.bubbles.push({ i, el, t: dur || 2 }); };
  function clearBubbles() { G.bubbles.forEach((b) => b.el.remove()); G.bubbles = []; }
  function updBubbles(dt, st) { G.bubbles = G.bubbles.filter((b) => { b.t -= dt; const p = st && st.players[b.i]; if (b.t <= 0 || !p) { b.el.remove(); return false; } const s = V.project(p.x, 2.3, p.z); b.el.style.left = s.x + 'px'; b.el.style.top = s.y + 'px'; return true; }); }

  /* ---------- input ---------- */
  G.inp = { mx: 0, mz: 0, keys: {}, joy: { x: 0, y: 0 } };
  G.shot = function (type, ax, pow) {
    if (!G.playing || G.paused || G.replay) return;
    if (G.isGuest) { PB.Net.sendReq(type, ax, pow); return; }
    if (G.m) G.m.request(G.me, type, ax, pow);
  };
  function setupInput() {
    const el = $('touch'); let sw = null;
    el.addEventListener('pointerdown', (e) => { Snd.unlock(); if (G.replay) { G.skipReplay(); return; } if (!G.playing) return; $('taunts').classList.add('hidden'); sw = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; try { el.setPointerCapture(e.pointerId); } catch (er) {} });
    el.addEventListener('pointermove', (e) => { if (!sw || e.pointerId !== sw.id) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.hypot(dx, dy) > 14 && dy < 0) { const a = swipeAim(dx, dy); G.aimPreview = a; } });
    const end = (e) => { if (!sw || e.pointerId !== sw.id) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y, L = Math.hypot(dx, dy); G.aimPreview = null; sw = null;
      if (L < 16) { G.shot('auto', 0, 0.45); return; }
      if (dy > 0 && dy > Math.abs(dx)) { G.shot('auto', 0, 0.15); return; } // pull-down = soft touch
      const a = swipeAim(dx, dy); G.shot('auto', a.ax, a.pow); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', (e) => { if (sw && e.pointerId === sw.id) { sw = null; G.aimPreview = null; } });
    // joystick
    const jb = $('joyBase'), jk = $('joyKnob'); let jid = null;
    const jmove = (e) => { const r = jb.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } G.inp.joy.x = x; G.inp.joy.y = y; jk.style.left = (39 + x * 40) + 'px'; jk.style.top = (39 + y * 40) + 'px'; };
    jb.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); jid = e.pointerId; try { jb.setPointerCapture(jid); } catch (er) {} jmove(e); });
    jb.addEventListener('pointermove', (e) => { if (e.pointerId === jid) jmove(e); });
    const jend = (e) => { if (e.pointerId !== jid) return; jid = null; G.inp.joy.x = 0; G.inp.joy.y = 0; jk.style.left = '39px'; jk.style.top = '39px'; };
    jb.addEventListener('pointerup', jend); jb.addEventListener('pointercancel', jend);
    // keyboard
    addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return; const k = e.key.toLowerCase(); G.inp.keys[k] = true; Snd.unlock();
      if (!G.playing) return;
      const lat = (G.inp.keys.d || G.inp.keys.arrowright ? 1 : 0) - (G.inp.keys.a || G.inp.keys.arrowleft ? 1 : 0);
      if (k === ' ') { e.preventDefault(); if (G.replay) G.skipReplay(); else G.shot('auto', lat * 0.8, 0.5); }
      else if (k === 'j' || k === '1') G.shot('dink', lat * 0.8, 0.5); else if (k === 'k' || k === '2') G.shot('drive', lat * 0.8, 0.6); else if (k === 'l' || k === '3') G.shot('lob', lat * 0.8, 0.6); else if (k === 'i' || k === '4') G.shot('smash', lat * 0.8, 0.7);
      else if (k === 'escape' || k === 'p') { if (UI.open === 'pause') { UI.close(); G.resume(); } else if (!UI.open) G.pauseMenu(); }
      else if (k === 't') G.toggleTaunts();
    });
    addEventListener('keyup', (e) => { G.inp.keys[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { G.inp.keys = {}; });
  }
  function swipeAim(dx, dy) { const up = Math.max(40, -dy); return { ax: U.clamp(dx / up * 1.1, -1.4, 1.4), pow: U.clamp((Math.hypot(dx, dy) - 24) / 220, 0, 1) }; }
  function moveInput() {
    const k = G.inp.keys; let mx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0), mz = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0);
    if (!mx && !mz) { mx = G.inp.joy.x; mz = -G.inp.joy.y; }
    const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; } return { mx, mz };
  }

  /* ---------- events (solo, host, and the guest's copy from the host) ---------- */
  G.teamName = (t) => G.names[t] || (t ? 'CPU' : 'YOU');
  G.onEvent = function (e) {
    const st = G.state(); if (!st) return;
    if (G.ctrl && G.ctrl.onEvent && G.ctrl.onEvent(e)) return;
    const shake = G.save.opts.shake !== false;
    if (e.t === 'callout') { const srv = st.players[e.server]; const mine = e.server === G.me; UI.call(e.text, mine ? 'YOUR SERVE' : (srv ? srv.name + ' serves' : '')); Snd.say(e.text); if (mine) UI.hint('Swipe up or tap to SERVE (underhand, into the box across)', 2600); }
    else if (e.t === 'hit') { const b = st.ball; if (e.type === 'smash') { Snd.fx('smash'); if (shake) V.shake(0.28); V.burst(b.x, b.y, b.z, '#ffe14d', 14, 4); V.cheer(0.8); } else if (e.type === 'dink') Snd.fx('dink'); else Snd.fx('pock', e.pow); if (e.type === 'drive' && e.speed > 15) V.burst(b.x, b.y, b.z, '#ffffff', 6, 2);
      if (e.perfect && e.p === G.me) UI.perfect('PERFECT TIMING!'); if (e.erne) UI.perfect('ERNE! 🔥'); if (e.p === G.me) { G.myHits = (G.myHits || 0) + 1; } }
    else if (e.t === 'bounce') { Snd.fx('bounce', st.ball.y); V.burst(e.x, 0.05, e.z, V.envName === 'beach' ? '#f2d38f' : '#e5e7eb', 4, 1); }
    else if (e.t === 'net') Snd.fx('net');
    else if (e.t === 'cord') { Snd.fx('cord'); UI.hint('Net cord! 😮', 1200); }
    else if (e.t === 'hint') { if (e.p === G.me) { UI.hint(e.text, 1600); if (e.kitchen) flashK(); } }
    else if (e.t === 'point') G.onPoint(e, st);
    else if (e.t === 'great') { if (!G.isGuest && G.m) { const clip = G.m.clip(e.from, e.to); G.pendingReplay = clip; if (!G.bestClip || clip.length > G.bestClip.length) G.bestClip = clip; } }
    else if (e.t === 'over') G.finish(e);
  };
  function flashK() { const k = $('kWarn'); k.classList.add('show'); clearTimeout(flashK.t); flashK.t = setTimeout(() => k.classList.remove('show'), 900); }
  G.onPoint = function (e, st) {
    if (e.practice) return;
    const mine = e.w === G.side, fault = !/Winner|Ace/.test(e.why), r = e.res || {};
    if (fault) Snd.fx('whistle');
    setTimeout(() => Snd.fx(mine ? 'point' : 'lose'), 180); if (mine) { V.cheer(1.6); Snd.crowd(0.25, 1.8); } else Snd.crowd(0.1, 1);
    let small = r.over ? 'GAME!' : r.point ? 'Point ' + G.teamName(e.w) : r.sideout ? 'SIDE OUT' : r.secondServer ? 'SECOND SERVER' : '';
    UI.msg(e.why, small, 1600);
    if (e.hits > G.longest) G.longest = e.hits;
    UI.board(st, G.names, G.me); V.setBoard(st.game.score[0], st.game.score[1], G.names[0], G.names[1]);
    if (mine && G.kind !== 'online' && Math.random() < 0.25 && G.m) { const opp = G.m.players.find((p) => p.team !== G.side && p.ctrl === 'ai'); if (opp) G.bubble(opp.i, U.pick(['Lucky!', 'Whoa!', 'Nice shot!', '😤', 'Hmph.']), 1.4); }
  };
  G.finish = function (e) {
    const st = G.state(), win = e.winner === G.side, sc = e.score.slice(); if (G.side === 1) sc.reverse();
    const me = st.players[G.me] || { stats: { winners: 0, errors: 0 } };
    if (win) { V.confettiBurst(0, G.side === 0 ? 4 : -4); Snd.fx('win'); Snd.crowd(0.35, 3); V.cheer(4); } else Snd.fx('lose');
    if (G.m) G.m.players.forEach((p) => { p.celeb = p.team === e.winner ? null : 'sad'; if (p.team !== e.winner) p.celebT = 3.5; });
    const s = G.save; s.stats.matches++; if (win) s.stats.wins++; s.stats.longest = Math.max(s.stats.longest, G.longest);
    let coins = 0, line = '', unlock = '', next = null;
    const myPts = e.score[G.side];
    if (G.kind === 'career') { const i = G.cfg.ladder, L = D.LADDER[i];
      if (win) { const first = s.career.beaten === i; coins = first ? L.reward : Math.round(L.reward * 0.3); if (first) { s.career.beaten = i + 1; if (s.owned.courts.indexOf(L.court) < 0) { s.owned.courts.push(L.court); unlock = D.court(L.court).n + ' court unlocked!'; } if (L.boss && s.owned.paddles.indexOf('gold') < 0) { s.owned.paddles.push('gold'); unlock += (unlock ? ' ' : '') + 'Golden Grok paddle!'; } } line = '“' + L.lose + '”'; if (i + 1 < D.LADDER.length) next = i + 1; else line += ' YOU ARE THE PICKLE CUP CHAMPION! 👑'; }
      else { coins = 10 + myPts * 2; line = '“' + L.win + '”'; } }
    else if (G.kind === 'online') { coins = (win ? 40 : 20) + myPts * 2; }
    else { const di = D.DIFF_ORDER.indexOf(G.cfg.diff); coins = win ? 35 + di * 20 + myPts * 2 : 10 + myPts * 2; }
    G.addCoins(coins); G.persist();
    G.lastResult = { win, score: sc, coins, stats: me.stats, longest: G.longest, line, unlock, next, replay: G.bestClip };
    setTimeout(() => { if (G.playing && G.state() === st) UI.results(G.lastResult); }, 2600);
  };

  /* ---------- replays ---------- */
  G.playReplay = function (clip, done) { if (!clip || clip.length < 3) { if (done) done(); return; } G.replay = { clip, t: clip[0].t, done }; $('replayBar').classList.remove('hidden'); if (!G.playing) { G.playing = true; UI.show('hud', true); } };
  G.skipReplay = function () { if (!G.replay) return; const d = G.replay.done; G.replay = null; $('replayBar').classList.add('hidden'); if (d) d(); };
  function replayTick(dt) {
    const r = G.replay, c = r.clip; r.t += dt * 0.6; let i = 0; while (i < c.length - 2 && c[i + 1].t < r.t) i++;
    const a = c[i], b = c[i + 1] || a, k = U.clamp((r.t - a.t) / Math.max(1e-3, b.t - a.t), 0, 1);
    const ball = { x: U.lerp(a.b[0], b.b[0], k), y: U.lerp(a.b[1], b.b[1], k), z: U.lerp(a.b[2], b.b[2], k), live: true, speed: 10 };
    const ps = a.p.map((p, j) => { const q = b.p[j] || p; return { x: U.lerp(p[0], q[0], k), z: U.lerp(p[1], q[1], k), face: U.lerpAng(p[2], q[2], k), swingT: U.lerp(p[3], q[3] < p[3] ? p[3] + (b.t - a.t) : q[3], k), swingType: p[4], swingSide: p[5], spd: p[6], celebT: 0 }; });
    V.syncPlayers(ps, dt * 0.6); V.syncBall(ball, dt * 0.6); V.replayCam(dt, ball, V.t); V.land(null); V.aim(null);
    if (r.t >= c[c.length - 1].t) G.skipReplay();
  }

  /* ---------- state accessor (host/solo: the match; guest: the host's mirror) ---------- */
  G.state = () => G.isGuest ? G.mirror : G.m;

  /* ---------- main loop ---------- */
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0, (now - G.last) / 1000)); G.last = now; G.t += dt;
    try { frame(dt); } catch (err) { console.error(err); }
  }
  function frame(dt) {
    Snd.tick(dt);
    if (G.playing && G.replay) { replayTick(dt); V.render(dt); return; }
    if (G.playing && !G.paused) {
      const st = G.state();
      if (!G.isGuest && G.m) {
        // a held great-point replay plays as the next point is set up
        if (G.pendingReplay && G.m.phase === 'pre' && G.kind !== 'online') { const clip = G.pendingReplay; G.pendingReplay = null; G.playReplay(clip, null); return; }
        const mi = moveInput(); G.m.move(G.me, mi.mx, mi.mz);
        G.m.update(dt);
        const online = PB.Net.room && G.kind === 'online';
        while (G.m.ev.length) { const e = G.m.ev.shift(); if (online) PB.Net.queue(e); G.onEvent(e); }
        if (G.ctrl && G.ctrl.tick) G.ctrl.tick(dt);
        if (PB.Net.room && G.kind === 'online') PB.Net.hostTick(dt);
      } else if (G.isGuest) { const mi = moveInput(); PB.Net.guestTick(dt, mi); }
      if (st) drawMatch(st, dt);
      fpsWatch(dt);
    } else if (!G.playing) {
      if (G.locker) lockerScene(dt);
      else if (G.demo) { G.demo.update(dt); G.demo.ev.length = 0; if (G.demo.phase === 'over') G.startDemo(V.envName); drawDemo(G.demo, dt); }
    } else { const st = G.state(); if (st) { V.syncPlayers(st.players, 0); } }
    updBubbles(dt, G.playing ? G.state() : null);
    V.render(dt);
  }
  function drawDemo(m, dt) { V.syncPlayers(m.players, dt); V.syncBall(Object.assign({ speed: Math.hypot(m.ball.vx, m.ball.vy, m.ball.vz) }, m.ball), dt); V.land(null); V.aim(null); V.kitchen(0, 0);
    const a = V.t * 0.06; const portrait = V.cam.aspect < 1; V.cam.fov = portrait ? 62 : 48; V.cam.position.set(Math.sin(a) * (portrait ? 13 : 14), portrait ? 9 : 7.5, Math.cos(a) * (portrait ? 19 : 15)); V.cam.lookAt(0, portrait ? -1.6 : 0.3, 0); V.cam.updateProjectionMatrix(); }
  function lockerScene(dt) {
    const m = V.models[0]; if (!m) return; G.lockT = (G.lockT || 0) + dt; m.position.set(0, 0, 5.2); m.rotation.y = Math.PI * 0.15 + Math.sin(G.lockT * 0.6) * 0.9 + G.lockT * 0.25;
    const cel = G.lockCeleb > 0; if (cel) G.lockCeleb -= dt;
    PB.M.pose(m, dt, { spd: 0, swingT: (G.lockT % 3) < 0.6 ? (G.lockT % 3) : 9, swingType: 'drive', swingSide: 1, ready: true, celebT: cel ? 1 : 0, celeb: G.save.eq.celebs, t: V.t });
    V.ball.visible = false; V.ballShadow.visible = false; V.trail.forEach((t) => { t.visible = false; }); V.land(null); V.aim(null);
    V.lockerCam(m);
  }
  function drawMatch(st, dt) {
    const me = st.players[G.me]; if (!me) return; const b = st.ball;
    const serveHold = st.phase === 'serve' || st.phase === 'pre' ? st.game.server : -1;
    V.syncPlayers(st.players.map((p) => Object.assign({}, p, { celeb: p.celeb })), dt, { serveHold });
    V.syncBall({ x: b.x, y: b.y, z: b.z, live: b.live, speed: Math.hypot(b.vx || 0, b.vy || 0, b.vz || 0), show: b.live || serveHold >= 0 }, dt);
    const assist = G.save.opts.assist, incoming = st.phase === 'rally' && st.rally && st.rally.lastTeam !== G.side && b.live;
    // landing spot (assist)
    G.landN = (G.landN || 0) + 1;
    if (assist && G.save.opts.land !== false && incoming) { if (G.landN % 3 === 0) { const pr = Ph.predict(b, 3, { nb: 1, path: false }); G.landP = pr.bounce && R.teamOfZ(pr.bounce.z) === G.side ? pr.bounce : null; } V.land(G.landP); } else V.land(null);
    // aim preview while swiping
    if (G.aimPreview && st.phase !== 'over') { const a = G.aimPreview, dir = G.side === 0 ? -1 : 1, ss = G.side === 0 ? 1 : -1; let x = a.ax * ss * D.HW * 0.75, z = dir * (1.2 + a.pow * 4.6); if (assist) x = U.clamp(x, -D.HW + 0.35, D.HW - 0.35); V.aim({ x, z }, a.pow > 0.62 ? '#ff7a3d' : a.pow < 0.25 ? '#4ade80' : '#3ff0ff'); } else V.aim(null);
    // kitchen warning (assist)
    const danger = assist && st.phase === 'rally' && st.rally && st.rally.lastTeam !== G.side && st.rally.bounces === 0 && b.live && Math.abs(me.z) < D.K + 0.7;
    V.kitchen(G.side, danger ? 1 : 0); $('kWarn').classList.toggle('show', !!danger && Math.abs(me.z) < D.K + 0.35);
    // smash button glows when the ball is high nearby
    $('bSmash').classList.toggle('hot', incoming && b.y > 1.6 && Math.hypot(b.x - me.x, b.z - me.z) < 4);
    V.playCam(dt, me.x, G.side, b.z, false);
  }
  function fpsWatch(dt) {
    if (G.gfx !== 'high' || G.gfxUser || G.replay) return; G.fpsAcc += dt; G.fpsN++;
    if (G.fpsAcc >= 5) { const fps = G.fpsN / G.fpsAcc; G.fpsAcc = 0; G.fpsN = 0; G.lastFps = fps; if (fps < 24) G.fpsLow++; else G.fpsLow = 0; if (G.fpsLow >= 2) { G.setGfx('low', false); UI.toast('Switched to Low graphics so it runs smoother (you can change it in Settings)'); } }
  }

  /* ---------- test hooks ---------- */
  window.__pb = { G, PB, V, sim(sec, step) { const s = step || 1 / 60; for (let t = 0; t < sec; t += s) { if (G.m) { G.m.update(s); while (G.m.ev.length) G.onEvent(G.m.ev.shift()); if (G.ctrl && G.ctrl.tick) G.ctrl.tick(s); } } } };
})();
