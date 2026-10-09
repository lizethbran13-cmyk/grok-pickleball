/* Grok Pickleball - interactive tutorial + 4 skill mini games (practice matches with a ball machine / feeder) */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U, R = PB.Rules, UI = PB.UI, V = PB.V, T = THREE;
  const $ = (id) => document.getElementById(id);
  const Mo = PB.Modes = {};
  const G = () => PB.G;
  Mo.MINIS = [
    { id: 'dinks', n: 'Target Dinks', icon: '🎯', desc: 'Soft dinks into the kitchen targets. 12 balls.' },
    { id: 'serve', n: 'Serve Ace', icon: '🏹', desc: 'Serve into the box. Corners score big! 10 serves.' },
    { id: 'react', n: 'Reaction Volleys', icon: '⚡', desc: 'Fast balls at the net! Volley them back. 3 misses and you\u2019re out.' },
    { id: 'smash', n: 'Smash Attack', icon: '💥', desc: 'Lobs are coming. SMASH them into the zones! 10 lobs.' }
  ];
  /* ---------- 3D targets ---------- */
  function target(x, z, r, col, pts) {
    const g = new T.Group(); const mat = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false, side: T.DoubleSide });
    const d = new T.Mesh(new T.CircleGeometry(r, 32), mat); d.rotation.x = -Math.PI / 2; g.add(d);
    const ring = new T.Mesh(new T.TorusGeometry(r, 0.035, 8, 40), new T.MeshBasicMaterial({ color: '#ffffff' })); ring.rotation.x = Math.PI / 2; g.add(ring);
    const ring2 = new T.Mesh(new T.TorusGeometry(r * 0.5, 0.03, 8, 30), new T.MeshBasicMaterial({ color: col })); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.01; g.add(ring2);
    const post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.9, 8), new T.MeshBasicMaterial({ color: '#ffffff' })); post.position.y = 0.45; g.add(post);
    const flag = new T.Mesh(new T.ConeGeometry(0.16, 0.3, 3), new T.MeshBasicMaterial({ color: col })); flag.rotation.z = -Math.PI / 2; flag.position.set(0.15, 0.82, 0); g.add(flag);
    g.position.set(x, 0.03, z); g.userData = { x, z, r, pts, col }; V.scene.add(g); return g;
  }
  function zone(x0, z0, x1, z1, col) { const m = new T.Mesh(new T.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0)), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.3, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2); V.scene.add(m); return m; }
  function drill(html) { const d = $('drill'); d.innerHTML = html; d.classList.remove('hidden'); }

  /* ---------- practice setup ---------- */
  function practice(court, cfg) {
    const g = G(), o = g.save.opts;
    const players = [{ ctrl: 'human', name: g.myName(), assist: cfg.forceAssist ? true : o.assist, look: g.myLook() }, { ctrl: 'ai', diff: 'pro', name: cfg.feederName || 'Coach Kai', look: g.aiLook(0, D.LADDER[6]) }];
    const m = new PB.Match({ doubles: false, practice: true, players, firstServe: cfg.firstServe || 0 });
    m.players[1].noHit = true; m.players[1].ai.err = 0; m.players[1].ai.aim = 0.15;
    const ctl = { objs: [], m, cfg, n: 0, score: 0, strikes: 0, wait: 0 };
    ctl.clean = () => { ctl.objs.forEach((o2) => V.scene.remove(o2)); ctl.objs = []; };
    g.begin(m, court, [g.myName(), 'Coach'], { kind: 'drill', ctrl: ctl, drill: true, noShots: false });
    m.phase = 'idle';
    if (cfg.forceAssist && !o.assist) UI.toast('Assist is on for the tutorial so you can learn the rules first 🛟');
    return ctl;
  }
  function place(m, i, x, z) { const p = m.players[i]; p.x = x; p.z = z; p.vx = p.vz = 0; p.home = i === 1 ? { x, z } : null; p.tgt = { x, z }; }
  function readyFeedPos(m) { place(m, 1, 0, -(D.K + 0.6)); }
  function feedTo(m, tx, tz, vh, s, clear, minApex, type) { const f = m.players[1]; m.feed({ team: 1, p: 1, x: f.x + 0.25, y: 0.85, z: f.z + 0.4, tx, tz, vh, s, clear, minApex, type }); }
  function finishDrill(ctl, title, lines, again) {
    const g = G(); setTimeout(() => {
      if (g.ctrl !== ctl) return; ctl.clean(); g.playing = false; UI.panel('<h2>' + title + '</h2>' + lines + '<div class="btnrow"><button class="btn alt" id="bM">MENU</button>' + (again ? '<button class="btn primary" id="bA">PLAY AGAIN</button>' : '') + '</div>', (c) => {
        c.querySelector('#bM').addEventListener('click', () => { UI.close(); g.toTitle(); });
        const a = c.querySelector('#bA'); if (a) a.addEventListener('click', () => { UI.close(); again(); });
      }, { name: 'drillEnd' });
    }, 900);
  }

  /* ---------- tutorial ---------- */
  const STEPS = [
    { id: 'serve', need: 2, title: '1/4 SERVE', text: 'Serve <b>underhand</b> from behind the baseline, <b>diagonally</b> into the glowing box. <b>Swipe up</b> (or tap) to serve!' },
    { id: 'bounce', need: 2, title: '2/4 TWO-BOUNCE RULE', text: 'The serve must <b>bounce</b> before you hit it. Watch the yellow ring, wait for the bounce, then <b>tap</b>!' },
    { id: 'dink', need: 3, title: '3/4 DINK', text: 'A dink is a soft shot that lands in the <b>kitchen</b> (the zone by the net). Press <b>DINK</b> or do a short swipe!' },
    { id: 'kitchen', need: 2, title: '4/4 THE KITCHEN', text: '<b>Volley</b> (hit before it bounces) from <b>behind the kitchen line</b>. Never volley while standing in the kitchen!' }
  ];
  Mo.startTutorial = function () {
    const ctl = practice('park', { forceAssist: true }); const m = ctl.m; ctl.step = 0; ctl.tut = true;
    const setup = () => {
      const st = STEPS[ctl.step]; ctl.clean(); ctl.n = 0; m.players.forEach((p) => { p.req = null; p.home = null; });
      drill('<b>' + st.title + '</b><br>' + st.text + '<br>✅ ' + ctl.n + ' / ' + st.need);
      if (st.id === 'serve') { m.game = R.newGame({ doubles: false, firstServe: 0 }); m.game.sn = 1; m.players[1].noHit = true; m.setPhase('pre'); ctl.objs.push(zone(-D.HW, -D.K, 0, -D.HL, '#ffe14d')); }
      else if (st.id === 'bounce') { m.game = R.newGame({ doubles: false, firstServe: 1 }); m.players[1].noHit = true; m.setPhase('pre'); }
      else if (st.id === 'dink') { m.game = R.newGame({ doubles: false }); readyFeedPos(m); place(m, 0, 0, D.K + 0.45); ctl.objs.push(zone(-D.HW, 0, D.HW, -D.K, '#4ade80')); ctl.wait = 0.8; m.phase = 'idle'; }
      else { m.game = R.newGame({ doubles: false }); readyFeedPos(m); place(m, 0, 0, D.K + 0.35); ctl.wait = 0.8; m.phase = 'idle'; }
    };
    const progress = () => { const st = STEPS[ctl.step]; drill('<b>' + st.title + '</b><br>' + st.text + '<br>✅ ' + ctl.n + ' / ' + st.need); };
    const good = (t) => { if (ctl.pause > 0 || ctl.step >= STEPS.length) return; ctl.n++; PB.Snd.fx('perfect'); UI.msg('NICE! ✅', t, 1300); progress(); if (ctl.n >= STEPS[ctl.step].need) { ctl.step++; if (ctl.step >= STEPS.length) return done(); ctl.pending = setup; ctl.pause = 1.5; } else ctl.again = 1.1; };
    const bad = (t, s) => { PB.Snd.fx('bad'); UI.msg(t, s || 'Try again!', 2200); ctl.again = 1.6; };
    const done = () => { const g = G(), first = !g.save.tutorialDone; g.save.tutorialDone = true; if (first) g.addCoins(100); g.persist(); finishDrill(ctl, '🎓 TUTORIAL DONE!', '<p class="sub">You know how to serve, the two-bounce rule, dinks and the kitchen. You\u2019re ready to play!' + (first ? '<br>🪙 +100 coins' : '') + '</p>', () => Mo.startTutorial()); ctl.over = true; };
    ctl.feedNext = () => { const st = STEPS[ctl.step].id; m.players.forEach((p) => { p.req = null; });
      if (st === 'serve' || st === 'bounce') { m.setPhase('pre'); return; }
      if (st === 'dink') { place(m, 0, (Math.random() - 0.5) * 1.2, D.K + 0.45); feedTo(m, m.players[0].x + (Math.random() - 0.5) * 0.6, 1.3, 4.6, -0.3, 0.14, 0, 'dink'); }
      else { place(m, 0, (Math.random() - 0.5) * 1.0, D.K + 0.35); const px = m.players[0].x; feedTo(m, px + 0.45, D.HL - 0.5, 7.2, 0.2, 0.55, 0, 'drive'); }
    };
    ctl.tick = (dt) => {
      if (ctl.over) return;
      if (ctl.pause > 0) { ctl.pause -= dt; if (ctl.pause <= 0 && ctl.pending) { const f = ctl.pending; ctl.pending = null; f(); } return; }
      if (ctl.again > 0) { ctl.again -= dt; if (ctl.again <= 0) ctl.feedNext(); return; }
      if (ctl.wait > 0) { ctl.wait -= dt; if (ctl.wait <= 0) ctl.feedNext(); return; }
      if (m.phase === 'dead' && m.phaseT > 2.2 && !ctl.again && !ctl.pause) ctl.feedNext();
    };
    ctl.onEvent = (e) => {
      const st = STEPS[ctl.step] && STEPS[ctl.step].id; if (ctl.over || ctl.pause > 0 || !st) return true;
      if (e.t === 'callout') { if (st === 'serve') UI.hint('Swipe up to serve into the yellow box ↗️', 2500); return true; }
      if (e.t === 'hit' && e.p === 0) { ctl.lastMine = e; }
      if (e.t === 'bounce') {
        const r = m.rally;
        if (st === 'serve' && r.hits === 1 && e.n === 1 && e.side === 1) good('Great serve! It landed in the box.');
        if (st === 'bounce' && r.lastTeam === 0 && e.side === 1 && e.n === 1) good('You let it bounce, then hit it. That\u2019s the two-bounce rule!');
        if (st === 'dink' && r.lastTeam === 0 && e.side === 1 && e.n === 1) { if (Math.abs(e.z) < D.K && Math.abs(e.x) <= D.HW) good('Soft dink into the kitchen!'); else bad('Too deep!', 'Use DINK or a short, gentle swipe.'); }
        if (st === 'kitchen' && r.lastTeam === 0 && e.side === 1 && e.n === 1) { if (ctl.lastMine && ctl.lastMine.volley) good('Clean volley from behind the line!'); else bad('Hit it before it bounces!', 'Tap when the ball reaches you.'); }
      }
      if (e.t === 'point') {
        const why = e.why || '';
        if (/Two-bounce|Kitchen|Serve|net|Out/i.test(why) && !(st === 'serve' && /Winner|Ace/.test(why))) bad(why);
        else if (/Winner|Ace/.test(why) && e.w === 1 && st !== 'serve') bad('Missed it!', st === 'bounce' ? 'Wait for the bounce, then tap.' : 'Tap when the ball comes to you.');
        ctl.again = ctl.again || 1.4;
        return true;
      }
      if (e.t === 'hint') { UI.hint(e.text, 1500); return true; }
      return false;
    };
    setup();
  };

  /* ---------- mini games ---------- */
  Mo.startMini = function (id) {
    const g = G(), ctl = practice(id === 'serve' ? 'park' : id === 'react' ? 'gym' : id === 'smash' ? 'beach' : 'park', {}); const m = ctl.m;
    const meta = Mo.MINIS.find((x) => x.id === id); ctl.total = id === 'dinks' ? 12 : id === 'serve' ? 10 : id === 'smash' ? 10 : 999; ctl.score = 0; ctl.n = 0; ctl.strikes = 0; ctl.combo = 0;
    const hud = () => drill('<b>' + meta.icon + ' ' + meta.n.toUpperCase() + '</b> · Score <b>' + ctl.score + '</b> · ' + (id === 'react' ? '❤️'.repeat(3 - ctl.strikes) + ' · streak ' + ctl.combo : 'Ball ' + Math.min(ctl.n + 1, ctl.total) + '/' + ctl.total));
    const targets = [];
    if (id === 'dinks') { targets.push(target(-1.9, -1.1, 0.55, '#ff4fd8', 3), target(0, -0.85, 0.7, '#ffe14d', 2), target(1.9, -1.2, 0.55, '#3ff0ff', 3)); ctl.objs.push(zone(-D.HW, 0, D.HW, -D.K, '#4ade80')); }
    if (id === 'smash') { targets.push(target(-2.1, -5.2, 0.9, '#ff4fd8', 3), target(2.1, -5.2, 0.9, '#3ff0ff', 3), target(0, -3.4, 0.8, '#ffe14d', 2)); }
    targets.forEach((t) => ctl.objs.push(t));
    const scoreLand = (x, z) => { let best = 0; targets.forEach((t) => { if (Math.hypot(x - t.userData.x, z - t.userData.z) <= t.userData.r) best = Math.max(best, t.userData.pts); }); return best; };
    ctl.feedNext = () => {
      m.players.forEach((p) => { p.req = null; });
      if (ctl.n >= ctl.total || ctl.strikes >= 3) return end();
      if (id === 'serve') { m.game = R.newGame({ doubles: false, firstServe: 0 }); m.game.score[0] = ctl.n % 2; R.setServer(m.game); m.players[1].noHit = true; m.setPhase('pre'); ctl.clean(); const want = m.game.serverSide === 'R' ? -1 : 1; ctl.objs.push(zone(want < 0 ? -D.HW : 0, -D.K, want < 0 ? 0 : D.HW, -D.HL, '#ffe14d')); ctl.objs.push(target(want * (D.HW - 0.65), -(D.HL - 0.65), 0.6, '#ff4fd8', 5), target(want * 0.6, -(D.HL - 0.7), 0.55, '#3ff0ff', 3)); ctl.tg = ctl.objs.slice(1); hud(); return; }
      readyFeedPos(m);
      if (id === 'dinks') { place(m, 0, (Math.random() - 0.5) * 1.6, D.K + 0.45); feedTo(m, m.players[0].x + (Math.random() - 0.5) * 0.8, 1.2 + Math.random() * 0.5, 4.6, -0.3, 0.14, 0, 'dink'); }
      else if (id === 'react') { place(m, 0, 0, D.K + 0.4); place(m, 1, (Math.random() - 0.5) * 2, -(D.HL - 0.6)); const sp = Math.min(19, 12.5 + ctl.combo * 0.45); const px = m.players[0].x + (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.45); feedTo(m, px, m.players[0].z + 2.4, sp, 0.6, 0.12, 0, 'drive'); }
      else if (id === 'smash') { place(m, 0, (Math.random() - 0.5) * 1.6, 3.6); place(m, 1, (Math.random() - 0.5) * 2, -(D.HL - 0.4)); feedTo(m, m.players[0].x + (Math.random() - 0.5) * 1.2, 3.4 + Math.random() * 1.2, 8, 0.4, 2.6, 4.6, 'lob'); }
      hud();
    };
    const end = () => { if (ctl.over) return; ctl.over = true; const best = g.save.best[id] || 0, nb = ctl.score > best; if (nb) g.save.best[id] = ctl.score; const coins = Math.round(ctl.score * (id === 'react' ? 4 : id === 'serve' ? 2 : 3)); g.addCoins(coins); g.persist();
      finishDrill(ctl, meta.icon + ' ' + meta.n.toUpperCase(), '<div class="score1">' + ctl.score + '</div><p class="sub">' + (nb ? '🌟 NEW BEST!' : 'Best: ' + best) + '<br>🪙 +' + coins + ' coins</p>', () => Mo.startMini(id)); };
    ctl.tick = (dt) => { if (ctl.over) return; if (ctl.wait > 0) { ctl.wait -= dt; if (ctl.wait <= 0) ctl.feedNext(); return; } if (m.phase === 'idle') ctl.wait = 0.6; };
    ctl.onEvent = (e) => {
      if (ctl.over) return true;
      const r = m.rally;
      if (e.t === 'callout') return true;
      if (e.t === 'bounce' && r.lastTeam === 0 && e.side === 1 && e.n === 1 && !ctl.scored) {
        ctl.scored = true; let pts = 0;
        if (id === 'serve') { if (r.hits === 1 && R.inServiceBox(0, m.game.serverSide, e.x, e.z)) { pts = 1; (ctl.tg || []).forEach((t) => { if (Math.hypot(e.x - t.userData.x, e.z - t.userData.z) <= t.userData.r) pts = Math.max(pts, t.userData.pts); }); } }
        else if (id === 'dinks') { if (Math.abs(e.z) < D.K && Math.abs(e.x) <= D.HW) pts = Math.max(1, scoreLand(e.x, e.z)); }
        else if (id === 'smash') { if (R.inCourt(e.x, e.z)) pts = 1 + scoreLand(e.x, e.z) + (ctl.lastSpeed > 18 ? 1 : 0); }
        else if (id === 'react') { if (R.inCourt(e.x, e.z)) { pts = 1; ctl.combo++; } }
        ctl.score += pts; if (pts > 1) { UI.perfect('+' + pts + (pts >= 3 ? ' BULLSEYE!' : '')); PB.Snd.fx('perfect'); } else if (pts === 1) PB.Snd.fx('coin'); else { PB.Snd.fx('bad'); UI.hint('Missed the zone', 900); if (id === 'react') { ctl.strikes++; ctl.combo = 0; } }
        hud();
      }
      if (e.t === 'hit' && e.p === 0) { ctl.lastSpeed = e.speed; }
      if (e.t === 'hit' && e.feed) ctl.scored = false;
      if (e.t === 'callout' || (e.t === 'hit' && e.type === 'serve')) ctl.scored = false;
      if (e.t === 'point') { if (!ctl.scored) { if (id === 'react') { ctl.strikes++; ctl.combo = 0; UI.hint('Missed! ' + (3 - ctl.strikes) + ' left', 1000); } else UI.hint(e.why, 1000); PB.Snd.fx('bad'); } ctl.n++; hud(); ctl.wait = 0.9; return true; }
      if (e.t === 'hint') { UI.hint(e.text, 1200); return true; }
      return false;
    };
    ctl.wait = 0.8; hud();
  };
})();
