/* Grok Pickleball - online play on GrokNet (PeerJS): host-authoritative, 5-letter codes, up to 3 players.
   2 friends: team up vs CPU (doubles) or play each other (singles). 3 friends: 2 vs 1 + CPU partner. */
(function () {
  'use strict';
  const PB = window.PB, GN = window.GrokNet, U = PB.U, D = PB.D, UI = PB.UI, R = PB.Rules, Ph = PB.Phys;
  const $ = (id) => document.getElementById(id);
  const N = PB.Net = { room: null, inLobby: false, looks: {}, assist: {}, cfg: { team: 'coop', diff: 'medium', court: 'park', scoring: 'sideout', to: 11, mode: 'normal' } };
  const G = () => PB.G;
  const TYPES = ['', 'serve', 'dink', 'drive', 'lob', 'smash'];
  let sendT = 0, mvT = 0, lastMv = '', evq = [];
  const r3 = (v) => Math.round(v * 1000) / 1000;
  function status(t, ok) { const m = $('onlineMsg'); if (m) { m.textContent = t; m.style.color = ok ? '#15803d' : '#be123c'; } N.lastStatus = t; }

  /* ---------- lobby UI ---------- */
  N.lobby = function () {
    if (N.room && N.room.opened) return N.roomPanel();
    UI.panel('<h2>🤝 PLAY WITH FRIENDS</h2><p class="sub">Up to 3 players online. One friend hosts and shares the 5-letter code.</p>' +
      '<div class="btnrow"><button class="btn primary big" id="bHost">🏠 HOST A GAME</button></div><h3>OR JOIN WITH A CODE</h3>' +
      '<div class="row"><input id="codeIn" maxlength="5" placeholder="ABCDE" autocomplete="off" autocapitalize="characters" /><button class="btn pink" id="bJoin">JOIN</button></div>' +
      '<p class="sub" id="onlineMsg" style="margin-top:8px"></p><div class="btnrow"><button class="btn alt" data-close>BACK</button></div>', (c) => {
      c.querySelector('#bHost').addEventListener('click', () => N.host());
      c.querySelector('#bJoin').addEventListener('click', () => { const code = GN.normalizeCode(c.querySelector('#codeIn').value); if (!GN.validCode(code)) return status('Codes are 5 letters, like KDXPQ'); N.join(code); });
    }, { name: 'lobby', onClose: () => { if (N.room && !N.room.opened) N.leave(); } });
  };
  N.roomPanel = function () {
    const room = N.room; if (!room) return; const ps = room.players(), host = room.isHost, c = N.cfg, owned = G().save.owned.courts;
    const list = ps.map((p) => '<div class="item"><div class="ic"><span class="sw" style="background:' + GN.cleanColor(p.color) + '"></span></div><div class="grow"><b>' + U.esc(p.name) + '</b><small>' + (p.slot === 0 ? 'Host' : 'Player ' + (p.slot + 1)) + (p.pid === room.pid ? ' (you)' : '') + '</small></div></div>').join('');
    const n = ps.length, smashOk = PB.DLC.on(); if (!smashOk) c.mode = 'normal'; const plan = N.plan(ps.map((p) => p.pid), c.team, c.mode);
    UI.panel('<h2>🤝 ROOM <span style="letter-spacing:4px;color:#7c3aed">' + room.code + '</span></h2><p class="sub">Friends join with code <b>' + room.code + '</b> (' + n + '/3)</p><div class="list">' + list + '</div>' +
      (host ? (smashOk ? '<h3>MODE</h3>' + UI.segH('nMode', [['normal', '🏓 NORMAL'], ['smash', '💥 SMASH MODE']]) + '<h3>YOUR SMASHER</h3>' + PB.Smash.charsHtml(PB.Smash.myChar()) : '') + '<h3>TEAMS</h3>' + UI.segH('nTeam', [['coop', '🤝 TEAM UP vs CPU'], ['versus', '⚔️ VERSUS']]) + '<p class="sub" id="nPlan">' + U.esc(plan.desc) + '</p>' +
        '<h3>CPU LEVEL</h3>' + UI.segH('nDiff', D.DIFF_ORDER.map((k) => [k, D.DIFF[k].n])) + '<h3>COURT</h3>' + UI.segH('nCourt', D.COURTS.filter((x) => owned.indexOf(x.id) >= 0).map((x) => [x.id, x.icon + ' ' + x.n])) +
        '<h3>SCORING</h3>' + UI.segH('nScore', [['sideout', 'SIDE-OUT'], ['rally', 'RALLY']]) +
        '<div class="btnrow"><button class="btn alt" id="bLeave">LEAVE</button><button class="btn primary big" id="bStart"' + (n < 2 ? ' disabled' : '') + '>START!</button></div>' + (n < 2 ? '<p class="sub">Waiting for a friend to join…</p>' : '')
        : (PB.DLC.hostShare ? '<h3>💥 YOUR SMASHER</h3><p class="sub small">(for Smash Mode, shared by the host)</p>' + PB.Smash.charsHtml(PB.Smash.myChar()) : '') + '<p class="sub">Waiting for the host to start the match… 🏓</p><div class="btnrow"><button class="btn alt" id="bLeave">LEAVE</button></div>'), (cc) => {
      cc.querySelector('#bLeave').addEventListener('click', () => { N.leave(); UI.close(); G().toTitle(); });
      const pickC = (id) => { G().save.smc = id; G().persist(); if (N.room) N.room.send({ t: 'look', look: lookMsg(), as: G().save.opts.assist }); if (N.room && N.room.isHost) N.looks[N.room.pid] = lookMsg(); };
      if (cc.querySelector('#smChars')) PB.Smash.bindChars(cc, pickC);
      if (!host) return;
      if (smashOk) UI.seg(cc, 'nMode', c.mode, (v) => { c.mode = v; cc.querySelector('#nPlan').textContent = N.plan(ps.map((p) => p.pid), c.team, v).desc; });
      UI.seg(cc, 'nTeam', c.team, (v) => { c.team = v; cc.querySelector('#nPlan').textContent = N.plan(ps.map((p) => p.pid), v, c.mode).desc; });
      UI.seg(cc, 'nDiff', c.diff, (v) => { c.diff = v; });
      if (owned.indexOf(c.court) < 0) c.court = 'park'; UI.seg(cc, 'nCourt', c.court, (v) => { c.court = v; });
      UI.seg(cc, 'nScore', c.scoring, (v) => { c.scoring = v; });
      cc.querySelector('#bStart').addEventListener('click', () => N.start());
    }, { name: 'room' });
  };
  // who plays where. slots: player index -> pid (or null = CPU)
  N.plan = function (pids, team, mode) {
    const n = pids.length;
    if (mode === 'smash') return { doubles: false, slots: [pids[0], pids[1] || null], smash: true, desc: '💥 Smash Mode: host vs friend' + (n > 2 ? ' (the 3rd player watches)' : '') };
    if (n <= 1) return { doubles: false, slots: [pids[0], null], desc: 'You vs CPU' };
    if (n === 2 && team === 'versus') return { doubles: false, slots: [pids[0], pids[1]], desc: 'Singles: host vs friend' };
    if (n === 2) return { doubles: true, slots: [pids[0], pids[1], null, null], desc: 'Doubles: you two vs 2 CPUs' };
    return { doubles: true, slots: [pids[0], pids[1], pids[2], null], desc: 'Doubles: 2 friends vs 1 friend + CPU partner' };
  };

  /* ---------- connect ---------- */
  function bind(room) {
    N.room = room;
    room.on('status', (t) => status(t, true));
    room.on('open', () => { if (room.isHost) PB.DLC.hostShare = false; N.inLobby = true; status('Connected!', true); PB.Snd.fx('coin'); room.send({ t: 'look', look: lookMsg(), as: G().save.opts.assist }); if (room.isHost) N.looks[room.pid] = lookMsg(); N.roomPanel(); UI.toast(room.isHost ? 'Room ' + room.code + ' is open! 🤝' : 'Joined room ' + room.code + '! 🤝'); });
    room.on('join', (p) => { if (room.isHost) room.broadcast({ t: 'dlc', on: PB.DLC.mine() ? 1 : 0 }); if (p.pid !== room.pid) { UI.toast('👋 ' + p.name + ' joined!'); PB.Snd.fx('coin'); } if (N.inLobby && UI.open === 'room') N.roomPanel(); });
    room.on('leave', (p) => { UI.toast(p.name + ' left', true); if (N.inLobby && UI.open === 'room') N.roomPanel(); const g = G(); if (room.isHost && g.playing && g.kind === 'online' && g.m) { g.m.players.forEach((pl) => { if (pl.pid === p.pid) { pl.ctrl = 'ai'; pl.diff = N.cfg.diff; pl.ai = Object.assign({}, D.DIFF[N.cfg.diff]); UI.toast('A CPU takes over for ' + p.name); } }); } });
    room.on('message', (d, from) => onMsg(d, from));
    room.on('reconnecting', () => UI.toast('Lost the host - reconnecting…', true));
    room.on('error', (e) => { PB.DLC.hostShare = false; status(e.title + ': ' + e.message); const g = G(); const was = g.playing && g.kind === 'online'; N.room = null; N.inLobby = false; if (was || UI.open === 'room') { UI.toast(e.title + ' - back to the menu', true); UI.close(); g.toTitle(); } });
    room.start();
  }
  function lookMsg() { const g = G(); return { name: g.myName(), look: g.myLook(), smc: PB.Smash.myChar() }; }
  N.host = function (code) { const g = G(); status('Opening a room…', true); N.looks = {}; N.assist = {}; bind(GN.createRoom({ role: 'host', code: code || undefined, name: g.myName(), color: g.myColor(), max: 3, rejoin: !!code })); };
  N.join = function (code) { const g = G(); status('Joining ' + code + '…', true); bind(GN.createRoom({ role: 'join', code, name: g.myName(), color: g.myColor(), rejoin: !!N.fromHub })); };
  N.fromParams = function (prm) { N.fromHub = true; $('nameIn').value = prm.name; GN.saveProfile(prm.name, prm.color); UI.show('scrTitle', false); N.lobby(); if (prm.mode === 'host') N.host(prm.code); else N.join(prm.code); };
  N.leave = function () { PB.DLC.hostShare = false; if (!N.room) return; try { N.room.leave(); } catch (e) {} N.room = null; N.inLobby = false; };

  /* ---------- starting (host) ---------- */
  N.start = function () {
    const room = N.room; if (!room || !room.isHost) return; const ps = room.players(); if (ps.length < 2) return;
    const plan = N.plan(ps.map((p) => p.pid), N.cfg.team, PB.DLC.on() ? N.cfg.mode : 'normal');
    const slots = plan.slots.map((pid) => pid ? { pid, smc: (N.looks[pid] && N.looks[pid].smc) || 'rita', name: (N.looks[pid] && N.looks[pid].name) || (room.player(pid) || {}).name || 'Friend', look: (N.looks[pid] && N.looks[pid].look) || G().aiLook(7) } : null);
    const cfg = { doubles: plan.doubles, smash: !!plan.smash && PB.DLC.on(), diff: N.cfg.diff, court: N.cfg.court, scoring: plan.smash ? 'rally' : N.cfg.scoring, to: plan.smash ? 15 : N.cfg.to, seed: (Math.random() * 1e9) | 0, ai: [G().aiLook(31), G().aiLook(47)] };
    N.lastStart = { cfg, slots };
    room.broadcast({ t: 'start', cfg, slots });
    N.begin(cfg, slots, true);
  };
  N.rematch = function () { if (N.room && N.room.isHost) N.start(); else UI.toast('Waiting for the host to start a rematch…'); };
  N.begin = function (cfg, slots, host) {
    const g = G(), room = N.room; N.inLobby = false; UI.close();
    let ai = 0; const nm = ['CPU Pete', 'CPU Rita'];
    const chars = cfg.smash ? slots.map((s) => s && D.SMASHERS.find((q) => q.id === s.smc) ? s.smc : 'rita') : null; if (chars && chars[1] === chars[0] && !slots[1]) chars[1] = 'fran';
    const players = slots.map((s, i) => s ? { ctrl: 'human', pid: s.pid, name: GN.cleanName(s.name), look: cfg.smash ? D.smasherLook(chars[i]) : sanitizeLook(s.look), assist: s.pid === room.pid ? g.save.opts.assist : (N.assist[s.pid] !== false) } : { ctrl: 'ai', diff: cfg.diff, name: nm[ai], look: sanitizeLook(cfg.ai[ai++ % 2]) });
    const me = slots.findIndex((s) => s && s.pid === room.pid);
    const team = (i) => cfg.doubles ? (i < 2 ? 0 : 1) : i;
    const nameOf = (t) => players.filter((p, i) => team(i) === t).map((p, k) => p.name + (chars ? ' ' + D.smasher(chars[t]).icon : '')).join(' + ');
    const m = new PB.Match({ doubles: cfg.doubles, scoring: cfg.scoring, to: cfg.to, players, seed: cfg.seed, slowAI: players.some((p) => p.ctrl === 'human' && p.assist), firstServe: 0 });
    if (chars && host) PB.Smash.attach(m, chars);
    if (host) { g.begin(m, cfg.court, [nameOf(0), nameOf(1)], { kind: 'online', me, cfg }); evq = []; }
    else { g.mirror = mirrorFrom(m); if (chars) { g.mirror.sm = { chars, en: [0, 0], armed: [0, 0], sup: null, frozen: [0, 0], smashes: [0, 0], supers: [0, 0] }; g.mirror.game.winBy = 1; } g.begin(m, cfg.court, [nameOf(0), nameOf(1)], { kind: 'online', me, cfg, guest: true }); g.m = null; g.mirror.target = null; }
    g.curLooks = players.map((p) => p.look);
    UI.toast(me >= 0 ? 'You are on the ' + (team(me) === 0 ? 'BLUE' : 'RED') + ' team! 🏓' : 'Watching');
  };
  function sanitizeLook(l) { const g = G(); if (!l || typeof l !== 'object') return g.aiLook(3); const pd = l.paddle && D.PADDLES.find((p) => p.id === l.paddle.id); const col = (c, d) => /^#[0-9a-fA-F]{6}$/.test(c || '') ? c : d;
    return { shirt: col(l.shirt, '#3b82f6'), shorts: col(l.shorts, '#1f2937'), hat: ['cap', 'visor', 'bucket', 'headband', 'crown', 'pickle', null].indexOf(l.hat) >= 0 ? l.hat : null, hatCol: col(l.hatCol, '#ffffff'), skin: U.clamp(l.skin | 0, 0, 4), hair: col(l.hair, '#5b3a1e'), pony: !!l.pony, bun: !!l.bun, long: !!l.long, glasses: !!l.glasses, paddle: pd || D.PADDLES[0], celeb: D.CELEBS.find((c) => c.id === l.celeb) ? l.celeb : 'fist' }; }
  function mirrorFrom(m) {
    return { players: m.players.map((p) => ({ i: p.i, team: p.team, name: p.name, x: p.x, z: p.z, face: p.face, swingT: 9, swingType: '', swingSide: 1, spd: 0, celebT: 0, stats: { hits: 0, winners: 0, errors: 0 }, tx: p.x, tz: p.z })),
      ball: Ph.make(), phase: 'pre', game: { score: [0, 0], st: 0, sn: m.game.sn, server: m.game.server, receiver: m.game.receiver, serverSide: 'R', doubles: m.o.doubles, scoring: m.o.scoring, to: m.o.to }, rally: { lastTeam: -1, bounces: 0, hits: 0 } };
  }

  /* ---------- host per-frame ---------- */
  N.queue = function (e) { if (e.t === 'great') return; const c = Object.assign({}, e); delete c.res; if (e.res) c.res = { point: e.res.point, sideout: e.res.sideout, secondServer: e.res.secondServer, over: e.res.over }; evq.push(c); };
  N.hostTick = function (dt) {
    const room = N.room, g = G(), m = g.m; if (!room || !room.opened || !m) return;
    sendT += dt; if (sendT < 0.05 && !evq.length) return; if (sendT < 0.033) return; sendT = 0;
    const b = m.ball, gm = m.game, r = m.rally;
    room.broadcast({ t: 's', ph: m.phase, b: [r3(b.x), r3(b.y), r3(b.z), r3(b.vx), r3(b.vy), r3(b.vz), r3(b.s), b.live ? 1 : 0, b.netDead ? 1 : 0],
      p: m.players.map((p) => [r3(p.x), r3(p.z), r3(p.face), r3(Math.min(p.swingT, 9)), TYPES.indexOf(p.swingType), p.swingSide, r3(p.spd || 0), r3(Math.max(0, p.celebT)), p.celeb === 'sad' ? 1 : 0, p.stats.winners, p.stats.errors]),
      g: [gm.score[0], gm.score[1], gm.st, gm.sn, gm.server, gm.receiver, gm.serverSide === 'R' ? 1 : 0, gm.over ? 1 : 0], r: [r.lastTeam, r.bounces, r.hits], sm: m.sm ? PB.Smash.pack(m.sm) : undefined, e: evq });
    evq = [];
  };

  /* ---------- guest per-frame ---------- */
  N.guestTick = function (dt, mi) {
    const g = G(), room = N.room, st = g.mirror; if (!st) return;
    mvT += dt; const key = mi.mx.toFixed(2) + ',' + mi.mz.toFixed(2); if (room && (key !== lastMv && mvT > 0.066 || mvT > 0.5)) { mvT = 0; lastMv = key; room.send({ t: 'mv', mx: +mi.mx.toFixed(2), mz: +mi.mz.toFixed(2) }); }
    // smooth players toward the host's positions, dead-reckon the ball between snapshots
    st.players.forEach((p) => { const k = Math.min(1, dt * 14); p.x = U.lerp(p.x, p.tx, k); p.z = U.lerp(p.z, p.tz, k); p.face = U.lerpAng(p.face, p.tf == null ? p.face : p.tf, k); p.swingT += dt; if (p.celebT > 0) p.celebT -= dt; });
    const b = st.ball; if (b.live) { const steps = Math.max(1, Math.ceil(dt / (1 / 120))); for (let i = 0; i < steps; i++) Ph.step(b, dt / steps); }
  };
  function applySnap(d) {
    const g = G(), st = g.mirror; if (!st) return;
    st.phase = String(d.ph || 'rally');
    const b = st.ball, a = d.b || []; b.x = +a[0] || 0; b.y = +a[1] || 0; b.z = +a[2] || 0; b.vx = +a[3] || 0; b.vy = +a[4] || 0; b.vz = +a[5] || 0; b.s = +a[6] || 0; b.live = !!a[7]; b.netDead = !!a[8];
    (d.p || []).forEach((q, i) => { const p = st.players[i]; if (!p || !Array.isArray(q)) return; p.tx = +q[0] || 0; p.tz = +q[1] || 0; p.tf = +q[2] || 0; if (+q[3] < p.swingT - 0.05) p.swingT = +q[3]; p.swingType = TYPES[q[4] | 0] || ''; p.swingSide = q[5] < 0 ? -1 : 1; p.spd = +q[6] || 0; p.celebT = +q[7] || 0; p.celeb = q[8] ? 'sad' : null; p.stats.winners = q[9] | 0; p.stats.errors = q[10] | 0; });
    const gg = d.g || []; Object.assign(st.game, { score: [gg[0] | 0, gg[1] | 0], st: gg[2] | 0, sn: gg[3] | 0, server: gg[4] | 0, receiver: gg[5] | 0, serverSide: gg[6] ? 'R' : 'L', over: !!gg[7] });
    const rr = d.r || []; st.rally = { lastTeam: rr[0] | 0, bounces: rr[1] | 0, hits: rr[2] | 0 };
    if (st.sm && d.sm) PB.Smash.unpack(st, d.sm);
    (Array.isArray(d.e) ? d.e : []).slice(0, 30).forEach((e) => { if (e && typeof e.t === 'string') { if (e.text) e.text = String(e.text).slice(0, 80); if (e.why) e.why = String(e.why).slice(0, 80); g.onEvent(e); } });
  }
  N.sendReq = function (type, ax, pow) { if (N.room) N.room.send({ t: 'req', type, ax: +ax || 0, pow: +pow || 0 }); };
  N.sendSuper = function () { if (N.room) N.room.send({ t: 'sup' }); };
  N.sendAssist = function (v) { if (N.room) N.room.send({ t: 'as', on: !!v }); };
  N.sendEmote = function (i, text) { if (!N.room) return; if (N.room.isHost) N.room.broadcast({ t: 'emo', i, text }); else N.room.send({ t: 'emo', i, text }); };

  /* ---------- messages ---------- */
  function onMsg(d, from) {
    const g = G(), room = N.room; if (!d || typeof d !== 'object' || !room) return;
    if (room.isHost) {
      if (d.t === 'look' && from) { N.looks[from] = { name: GN.cleanName(d.look && d.look.name), look: d.look && d.look.look, smc: D.SMASHERS.find((q) => q.id === (d.look && d.look.smc)) ? d.look.smc : 'rita' }; N.assist[from] = d.as !== false; return; }
      const m = g.m; const pi = m && g.kind === 'online' ? m.players.findIndex((p) => p.pid === from && p.ctrl === 'human') : -1;
      if (d.t === 'mv' && pi >= 0 && from !== room.pid) m.move(pi, +d.mx || 0, +d.mz || 0);
      else if (d.t === 'req' && pi >= 0 && from !== room.pid) { const ty = ['auto', 'dink', 'drive', 'lob', 'smash'].indexOf(d.type) >= 0 ? d.type : 'auto'; m.request(pi, ty, +d.ax || 0, +d.pow || 0); }
      else if (d.t === 'sup' && pi >= 0 && from !== room.pid) { if (m.sm) PB.Smash.arm(pi); }
      else if (d.t === 'as' && from) { N.assist[from] = !!d.on; if (pi >= 0) { m.players[pi].assist = !!d.on; m.slowAI = m.players.some((p) => p.ctrl === 'human' && p.assist); } }
      else if (d.t === 'emo' && from !== room.pid) { const i = U.clamp(d.i | 0, 0, 3); const txt = String(d.text || '').slice(0, 40); room.broadcast({ t: 'emo', i, text: txt }); g.bubble(i, txt, 2.2); }
      return;
    }
    if (d.t === 'dlc') { PB.DLC.hostShare = !!d.on; if (N.inLobby && UI.open === 'room') N.roomPanel(); return; }
    if (d.t === 'start') { const cfg = d.cfg || {}; const slots = Array.isArray(d.slots) ? d.slots.slice(0, 4) : []; if (!D.COURTS.find((c) => c.id === cfg.court)) cfg.court = 'park'; if (!D.DIFF[cfg.diff]) cfg.diff = 'medium'; cfg.ai = Array.isArray(cfg.ai) ? cfg.ai : []; N.begin(cfg, slots.map((s) => s && s.pid ? s : null), false); }
    else if (d.t === 's') applySnap(d);
    else if (d.t === 'emo') { if (g.playing) g.bubble(U.clamp(d.i | 0, 0, 3), String(d.text || '').slice(0, 40), 2.2); }
  }
})();
