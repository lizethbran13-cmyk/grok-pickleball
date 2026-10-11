/* Grok Pickleball - SMASH MODE (Pickle Smash Expansion DLC).
   Singles vs a CPU or a friend. Pop-ups happen all the time, so you smash a LOT: a smash winner is worth 2 points, a super smash winner 3.
   Every hit (and every point you lose) fills your energy bar. When it's full, press SUPER: your next hit is your Smasher's super smash.
   Runs on the normal Match (host-authoritative) through its hooks; guests render the host's snapshot. */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U, R = PB.Rules, Ph = PB.Phys, T = THREE;
  const $ = (id) => document.getElementById(id);
  const S = PB.Smash = {};
  const G = () => PB.G, UI = () => PB.UI, V = () => PB.V;
  const KINDS = ['', 'rocket', 'freeze', 'zap', 'giant', 'split', 'banana'];
  const SUPCOL = { rocket: '#ff5a1a', freeze: '#67e8f9', zap: '#fde047', giant: '#f97316', split: '#84cc16', banana: '#ffe14d' };
  S.KINDS = KINDS;

  /* ---------- locked info / menus ---------- */
  S.lockedInfo = function (full) {
    if (!full) { UI().toast('\uD83D\uDD12 Part of the Pickle Smash Expansion. Unlock it in the Grok Arcade DLC Shop!', true); PB.Snd.fx('bad'); return; }
    UI().panel('<div class="dlcTag">\uD83D\uDD12 DLC</div><h2>\uD83D\uDCA5 PICKLE SMASH EXPANSION</h2><ul class="help">' +
      '<li>\uD83D\uDCA5 <b>SMASH MODE</b> vs a CPU or a friend: tons of pop-ups, smash winners are worth 2, super smashes 3!</li>' +
      '<li>\u26A1 Fill your <b>energy bar</b> and unleash your Smasher\u2019s super: ' + D.SMASHERS.map((s) => s.icon + ' ' + s.sn).join(', ') + '</li>' +
      '<li>\uD83C\uDF0B\uD83D\uDE80\uD83C\uDF6D 3 new venues: <b>Lava Island</b>, <b>Moon Base</b> and <b>Candy Stadium</b></li>' +
      '<li>\uD83C\uDFD3 3 new paddles: <b>Rocket Blaster</b>, <b>Thunder Strike</b>, <b>Frost Bite</b></li></ul>' +
      '<div class="btnrow"><button class="btn alt" data-close>BACK</button><a class="btn gold" href="' + PB.DLC.SHOP + '">UNLOCK IN THE ARCADE (75 \uD83C\uDF9F\uFE0F)</a></div>', null, { name: 'dlcInfo' });
  };
  S.myChar = function () { const g = G(); return D.SMASHERS.find((s) => s.id === g.save.smc) ? g.save.smc : 'rita'; };
  S.charsHtml = function (sel) {
    return '<div class="smChars" id="smChars">' + D.SMASHERS.map((s) => '<button type="button" data-c="' + s.id + '" class="' + (s.id === sel ? 'on' : '') + '" style="--c:' + s.col + '"><i>' + s.icon + '</i><b>' + U.esc(s.n) + '</b><small>' + s.sn + '</small></button>').join('') + '</div><p class="sub smDesc" id="smDesc">' + U.esc(D.smasher(sel).desc) + '</p>';
  };
  S.bindChars = function (c, cb) { c.querySelectorAll('#smChars [data-c]').forEach((b) => b.addEventListener('click', () => { c.querySelectorAll('#smChars [data-c]').forEach((x) => x.classList.toggle('on', x === b)); const s = D.smasher(b.dataset.c); c.querySelector('#smDesc').textContent = s.desc; PB.Snd.fx('ui'); cb(s.id); })); };
  S.menu = function () {
    if (!PB.DLC.on()) return S.lockedInfo(true);
    const g = G(), o = g.save.opts, owned = g.save.owned.courts; let sel = S.myChar();
    o.smTo = o.smTo || 15; o.smDiff = D.DIFF[o.smDiff] ? o.smDiff : 'medium'; if (owned.indexOf(o.smCourt) < 0) o.smCourt = owned.indexOf('volcano') >= 0 ? 'volcano' : 'park';
    UI().panel('<h2>\uD83D\uDCA5 SMASH MODE</h2><p class="sub">Smash winners = <b>2 pts</b>, super smashes = <b>3 pts</b>. Fill your energy bar, then hit <b>SUPER</b>!</p><h3>PICK YOUR SMASHER</h3>' + S.charsHtml(sel) +
      '<h3>CPU LEVEL</h3>' + UI().segH('smD', D.DIFF_ORDER.map((k) => [k, D.DIFF[k].n.toUpperCase()])) +
      '<h3>COURT</h3>' + UI().segH('smC', D.COURTS.filter((c) => owned.indexOf(c.id) >= 0).map((c) => [c.id, c.icon + ' ' + c.n])) +
      '<h3>FIRST TO</h3>' + UI().segH('smT', [['11', '11'], ['15', '15'], ['21', '21']]) +
      '<p class="sub small">Want to smash a friend? \uD83E\uDD1D PLAY WITH FRIENDS \u2192 host \u2192 MODE: SMASH</p>' +
      '<div class="btnrow"><button class="btn alt" data-close>BACK</button><button class="btn primary big" id="smGo">SMASH! \uD83D\uDCA5</button></div>', (c) => {
      S.bindChars(c, (id) => { sel = id; g.save.smc = id; g.persist(); });
      UI().seg(c, 'smD', o.smDiff, (v) => { o.smDiff = v; }); UI().seg(c, 'smC', o.smCourt, (v) => { o.smCourt = v; g.previewCourt(v); }); UI().seg(c, 'smT', String(o.smTo), (v) => { o.smTo = +v; });
      c.querySelector('#smGo').addEventListener('click', () => { g.save.smc = sel; g.persist(); UI().close(); S.start({ smash: true, char: sel, diff: o.smDiff, court: o.smCourt, to: o.smTo }); });
    }, { name: 'smash' });
  };

  /* ---------- starting ---------- */
  S.start = function (cfg) {
    const g = G(), o = g.save.opts, me = D.smasher(cfg.char);
    const others = D.SMASHERS.filter((s) => s.id !== me.id); const opp = cfg.opp && cfg.opp !== me.id ? D.smasher(cfg.opp) : others[Math.floor(Math.random() * others.length)];
    cfg = Object.assign({}, cfg, { opp: opp.id });
    const players = [{ ctrl: 'human', name: g.myName(), assist: o.assist, look: D.smasherLook(me.id) }, { ctrl: 'ai', diff: cfg.diff, name: opp.n, look: D.smasherLook(opp.id), style: { dink: 0.7, drive: 1.2, lob: 0.6, smash: 2.4 } }];
    const m = new PB.Match({ doubles: false, scoring: 'rally', to: cfg.to || 15, players, slowAI: o.assist, firstServe: Math.random() < 0.5 ? 0 : 1 });
    S.attach(m, [me.id, opp.id]);
    g.begin(m, cfg.court, [g.myName() + ' ' + me.icon, opp.n + ' ' + opp.icon], { kind: 'smash', cfg });
    setTimeout(() => { if (g.m === m) g.bubble(1, ['Get ready to get SMASHED!', 'My super is unstoppable!', 'Smash time! \uD83D\uDCA5'][Math.floor(Math.random() * 3)], 2.6); }, 700);
  };

  /* ---------- the rules layer (host / solo) ---------- */
  S.attach = function (m, chars) {
    m.game.winBy = 1;
    const sm = m.sm = { chars: chars.slice(0, 2), en: [0, 0], armed: [0, 0], sup: null, frozen: [0, 0], smashes: [0, 0], supers: [0, 0], aiT: [0, 0] };
    const charOf = (team) => D.smasher(sm.chars[team]);
    const teamP = (t) => m.players.filter((p) => p.team === t);
    m.hooks.hit = function (mm, p, type) {
      if (type === 'serve') { sm.sup = null; return; }
      sm.en[p.team] = Math.min(100, sm.en[p.team] + (type === 'smash' ? 22 : 9));
      if (type === 'smash') sm.smashes[p.team]++;
      if (sm.armed[p.team]) { superShot(p); return; }
      sm.sup = null;
      // pop-ups! the other side gets a juicy high ball to smash
      if (type !== 'smash' && mm.rally.hits >= 2 && mm.rnd() < (p.ctrl === 'ai' ? 0.42 : 0.3)) {
        const b = mm.ball, dir = mm.dirZ(p.team), tz = dir * (2.7 + mm.rnd() * 1.8), tx = U.clamp(b.x * 0.3 + (mm.rnd() - 0.5) * 2.6, -D.HW + 0.6, D.HW - 0.6);
        const v = Ph.solve({ x: b.x, y: b.y, z: b.z }, tx, tz, 5.2, 0.2, 0, 2.2, 3.7); Object.assign(b, { vx: v.vx, vy: v.vy, vz: v.vz, s: 0.2, sd: 0 });
        mm.emit('pop', { team: 1 - p.team });
      }
    };
    function superShot(p) {
      const b = m.ball, dir = m.dirZ(p.team), ch = charOf(p.team), k = ch.sup, op = 1 - p.team;
      sm.armed[p.team] = 0; sm.en[p.team] = 0; sm.supers[p.team]++;
      const opx = teamP(op).reduce((a, q) => a + q.x, 0) / Math.max(1, teamP(op).length);
      const open = U.clamp(opx > 0 ? -D.HW + 0.7 : D.HW - 0.7, -D.HW + 0.7, D.HW - 0.7);
      let tx = open, tz = dir * (D.HL - 1.1), vh = 15, s = 0.6, clear = 0.25, minApex = 0, curve = 0;
      if (k === 'rocket') { vh = 23; s = 0.1; clear = 0.3; tz = dir * (D.HL - 1.3); }
      else if (k === 'giant') { vh = 9; clear = 1.2; minApex = 2.4; tz = dir * (D.HL - 2.2); tx = U.clamp(opx * 0.4, -D.HW + 1, D.HW - 1); }
      else if (k === 'banana') { curve = Math.sign(open) * 6; vh = 15.5; s = 0.3; }
      else if (k === 'zap') { vh = 16; }
      else if (k === 'split') { vh = 14; }
      let v = Ph.solve({ x: b.x, y: Math.max(0.3, b.y), z: b.z }, tx, tz, vh, s, 0, clear, minApex);
      if (k === 'banana') { // pre-aim against the curve: fly a copy of the ball (with the curve) and correct the aim until it lands in the corner
        const from = { x: b.x, y: Math.max(0.3, b.y), z: b.z }; let aim = open - curve * 0.25;
        for (let it = 0; it < 6; it++) { const c = Ph.copy(Object.assign({}, b, from, v, { s, sd: 0 })); let land = null;
          for (let t = 0; t < 4 && !land; t += 1 / 120) { c.vx += curve / 120; const e = Ph.step(c, 1 / 120); if (e && e.t === 'bounce') land = c; if (c.y <= 0.0 && !land) land = c; }
          if (!land) break; const err = open - land.x; if (Math.abs(err) < 0.12) break; aim += err; v = Ph.solve(from, aim, tz, vh, s, 0, clear, minApex); }
      }

      Object.assign(b, { y: Math.max(0.3, b.y), vx: v.vx, vy: v.vy, vz: v.vz, s, sd: 0 });
      sm.sup = { kind: k, team: p.team, t: 0, bounced: 0, crossed: 0, curve, fresh: 1 };
      if (k === 'freeze') sm.frozen[op] = 2.2;
      m.emit('super', { p: p.i, team: p.team, kind: k, name: ch.sn });
    }
    S.arm = function (pi) { const p = m.players[pi]; if (!p || m.sm !== sm) return false; if (sm.en[p.team] < 100 || sm.armed[p.team]) return false; sm.armed[p.team] = 1; m.emit('armed', { team: p.team, p: pi }); return true; };
    m.hooks.bounce = function (mm, ev, f) {
      const sp = sm.sup; if (!sp || sp.bounced || R.teamOfZ(ev.z) === sp.team) return false;
      sp.bounced = 1; if (f) return false;
      if (sp.kind === 'rocket') { mm.emit('boom', { x: ev.x, z: ev.z }); mm.endRally(sp.team, 'ROCKET BALL! \uD83D\uDCA5', { winner: true, loser: 1 - sp.team }); return true; }
      if (sp.kind === 'giant') { const b = mm.ball; b.vy = 10.5; b.vz = mm.dirZ(sp.team) * 3.1; b.vx *= 0.4; mm.emit('boing', { x: ev.x, z: ev.z }); }
      return false;
    };
    const baseTick = m.tick, baseEnd = m.endRally, baseSet = m.setPhase;
    m.setPhase = function (ph) { if (ph === 'pre') { sm.sup = null; sm.frozen = [0, 0]; } return baseSet.call(this, ph); };
    m.tick = function (dt) {
      const hold = [];
      [0, 1].forEach((t) => {
        if (sm.frozen[t] > 0) { sm.frozen[t] -= dt; teamP(t).forEach((p) => { p.noHit = true; hold.push([p, p.x, p.z]); }); if (sm.frozen[t] <= 0) teamP(t).forEach((p) => { p.noHit = false; }); }
        // CPU smashers fire their super soon after it fills up
        const cpu = teamP(t).some((p) => p.ctrl === 'ai');
        if (cpu && sm.en[t] >= 100 && !sm.armed[t]) { sm.aiT[t] += dt; if (sm.aiT[t] > 0.7) { sm.aiT[t] = 0; sm.armed[t] = 1; this.emit('armed', { team: t }); } }
      });
      const sp = sm.sup, b = this.ball;
      if (sp && b.live && this.phase === 'rally') {
        sp.t += dt; const op = 1 - sp.team;
        if (!sp.bounced) {
          if (sp.kind === 'banana') b.vx += sp.curve * dt;
          if (sp.kind === 'rocket' || sp.kind === 'giant') teamP(op).forEach((p) => { p.noHit = true; });
          if (!sp.crossed && R.teamOfZ(b.z) === op) { sp.crossed = 1; if (sp.kind === 'zap') { sm.frozen[op] = Math.max(sm.frozen[op], 1.1); this.emit('zap', { team: op }); } if (sp.kind === 'banana') { sm.frozen[op] = Math.max(sm.frozen[op], 0.75); this.emit('slip', { team: op }); } }
        }
        if ((sp.kind === 'split' || sp.kind === 'banana') && sp.fresh) { sp.fresh = 0; teamP(op).forEach((p) => { p.planHit = this.rally.hits; p.reactT = sp.kind === 'split' ? 1.0 : 0.9; p.plan = null; }); }
      }
      baseTick.call(this, dt);
      hold.forEach(([p, x, z]) => { p.x = x; p.z = z; p.vx = p.vz = 0; });
      if (sp && (sp.kind === 'rocket' && (sp.bounced || this.phase !== 'rally') || sp.kind === 'giant' && this.phase !== 'rally')) teamP(1 - sp.team).forEach((p) => { if (!(sm.frozen[p.team] > 0)) p.noHit = false; });
    };
    m.endRally = function (w, why, f) {
      if (this.phase !== 'rally') return;
      const last = this.players[this.rally.lastPlayer]; let pts = 1, tag = '';
      if (f && f.winner && last && last.team === w) { if (sm.sup && sm.sup.team === w) { pts = 3; tag = charOf(w).sn + '!'; } else if (last.swingType === 'smash') { pts = 2; tag = 'SMASH POINT!'; } }
      sm.en[1 - w] = Math.min(100, sm.en[1 - w] + 14); sm.en[w] = Math.min(100, sm.en[w] + 5);
      this.game.score[w] += pts - 1; sm.sup = null; sm.frozen = [0, 0]; this.players.forEach((p) => { p.noHit = false; });
      if (pts > 1) this.emit('smpt', { w, pts, tag });
      return baseEnd.call(this, w, why, f);
    };
    return sm;
  };

  /* ---------- online glue ---------- */
  S.pack = function (sm) { const sp = sm.sup; return [Math.round(sm.en[0]), Math.round(sm.en[1]), sm.armed[0], sm.armed[1], sp ? KINDS.indexOf(sp.kind) : 0, sp ? sp.team : 0, sp && sp.bounced ? 1 : 0, sm.frozen[0] > 0 ? 1 : 0, sm.frozen[1] > 0 ? 1 : 0, sm.smashes[0], sm.smashes[1], sm.supers[0], sm.supers[1]]; };
  S.unpack = function (st, a) {
    if (!Array.isArray(a)) return; const sm = st.sm || (st.sm = { chars: ['rita', 'fran'], en: [0, 0], armed: [0, 0], sup: null, frozen: [0, 0], smashes: [0, 0], supers: [0, 0] });
    sm.en = [U.clamp(+a[0] || 0, 0, 100), U.clamp(+a[1] || 0, 0, 100)]; sm.armed = [a[2] ? 1 : 0, a[3] ? 1 : 0];
    const k = KINDS[a[4] | 0]; if (k) { if (!sm.sup || sm.sup.kind !== k) sm.sup = { kind: k, team: a[5] ? 1 : 0, t: 0, bounced: 0 }; sm.sup.bounced = a[6] ? 1 : 0; } else sm.sup = null;
    sm.frozen = [a[7] ? 1 : 0, a[8] ? 1 : 0]; sm.smashes = [a[9] | 0, a[10] | 0]; sm.supers = [a[11] | 0, a[12] | 0];
  };
  S.press = function () {
    const g = G(); if (!g.playing || g.paused || g.replay) return; const st = g.state(); if (!st || !st.sm) return;
    const t = st.players[g.me] ? st.players[g.me].team : 0;
    if (st.sm.en[t] < 100) { UI().hint('Fill your energy bar first: hit, smash and win points! \u26A1', 1400); PB.Snd.fx('bad'); return; }
    if (g.isGuest) { PB.Net.sendSuper(); return; }
    if (S.arm(g.me)) PB.Snd.fx('perfect');
  };

  /* ---------- events (from the sim, or from the host for guests) ---------- */
  S.onEvent = function (e) {
    const g = G(), st = g.state(); if (!st || !st.sm) return false; const myT = st.players[g.me] ? st.players[g.me].team : 0, v = V(), u = UI();
    if (e.t === 'pop') { if (e.team === myT) u.hint('POP-UP! SMASH IT! \uD83D\uDCA5', 1200); return true; }
    if (e.t === 'armed') { const ch = D.smasher(st.sm.chars[e.team]); if (e.team === myT) u.msg('SUPER READY!', ch.sn + ': your next hit!', 1300); else { u.hint(ch.n + ' is charging a ' + ch.sn + '! \u26A0\uFE0F', 1600); const op = st.players.find((p) => p.team === e.team); if (op) g.bubble(op.i, ch.icon + ' ' + ch.sn + '!', 1.6); } PB.Snd.fx('perfect'); return true; }
    if (e.t === 'super') { const ch = D.smasher(st.sm.chars[e.team]); u.perfect(ch.icon + ' ' + ch.sn + '!'); PB.Snd.fx('smash'); v.shake(0.5); const b = st.ball; v.burst(b.x, b.y, b.z, SUPCOL[e.kind] || '#fff', 26, 6); v.cheer(1.5); if (st.sm) { st.sm.sup = st.sm.sup && st.sm.sup.kind === e.kind ? st.sm.sup : { kind: e.kind, team: e.team, t: 0, bounced: 0 }; st.sm.sup.t = 0; } return true; }
    if (e.t === 'boom') { PB.Snd.fx('smash'); v.shake(0.7); v.burst(e.x, 0.2, e.z, '#ff5a1a', 40, 8); v.burst(e.x, 0.2, e.z, '#ffe14d', 30, 6); v.burst(e.x, 0.4, e.z, '#57534e', 20, 3); return true; }
    if (e.t === 'boing') { PB.Snd.fx('bounce', 3); v.burst(e.x, 0.1, e.z, '#f97316', 18, 4); return true; }
    if (e.t === 'zap') { PB.Snd.fx('smash'); st.players.forEach((p) => { if (p.team === e.team) v.burst(p.x, 1.2, p.z, '#fde047', 24, 5); }); if (e.team === myT) u.hint('ZAPPED! \u26A1', 1000); return true; }
    if (e.t === 'slip') { PB.Snd.fx('bounce', 2); st.players.forEach((p) => { if (p.team === e.team) v.burst(p.x, 0.2, p.z, '#ffe14d', 18, 3); }); if (e.team === myT) u.hint('SLIPPED ON A BANANA! \uD83C\uDF4C', 1000); else { const op = st.players.find((p) => p.team === e.team); if (op) g.bubble(op.i, 'Whoa! \uD83C\uDF4C', 1.2); } return true; }
    if (e.t === 'smpt') { u.perfect('+' + e.pts + ' ' + e.tag); return true; }
    return false;
  };

  /* ---------- HUD + 3D effects (every frame) ---------- */
  function ensureHud() {
    if ($('smHud')) return;
    const h = document.createElement('div'); h.id = 'smHud'; h.className = 'hidden';
    h.innerHTML = [0, 1].map((t) => '<div class="smBar t' + t + '" id="smB' + t + '"><span class="ic" id="smI' + t + '"></span><div class="tr"><i id="smE' + t + '"></i></div><span class="ct" id="smS' + t + '"></span></div>').join('');
    $('hud').appendChild(h);
    const b = document.createElement('button'); b.id = 'bSuper'; b.type = 'button'; b.className = 'hidden'; b.innerHTML = '<i>\u26A1</i><b>SUPER</b><span id="bSupF"></span>'; $('hud').appendChild(b);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); PB.Snd.unlock(); S.press(); });
    addEventListener('keydown', (e) => { if ((e.key === 'e' || e.key === 'E' || e.key === 'Shift') && G().playing) S.press(); });
  }
  const fx = { halo: null, flame: null, decoys: [], ice: [], aura: [], bolt: null, last: '' };
  function ensureFx() {
    const v = V(); if (fx.halo && fx.halo.parent) return;
    fx.halo = new T.Mesh(new T.SphereGeometry(0.11, 14, 10), new T.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); v.ball.add(fx.halo);
    fx.flame = new T.Mesh(new T.ConeGeometry(0.08, 0.5, 10), new T.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })); v.scene.add(fx.flame);
    fx.decoys = [0, 1].map(() => { const d = PB.M.ball(); d.traverse((q) => { if (q.isMesh) { q.material = q.material.clone(); q.material.color && q.material.color.set('#84cc16'); } }); v.scene.add(d); return d; });
    fx.ice = [0, 1, 2, 3].map(() => { const m = new T.Mesh(new T.BoxGeometry(1.0, 2.1, 1.0), new T.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2, emissive: '#38bdf8', emissiveIntensity: 0.25, depthWrite: false })); v.scene.add(m); return m; });
    fx.aura = [0, 1, 2, 3].map(() => { const m = new T.Mesh(new T.RingGeometry(0.5, 0.68, 32), new T.MeshBasicMaterial({ color: '#ffe14d', transparent: true, opacity: 0.8, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; v.scene.add(m); return m; });
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); fx.bolt = new T.Line(bg, new T.LineBasicMaterial({ color: '#fde047' })); v.scene.add(fx.bolt);
  }
  S.hide = function () { const h = $('smHud'); if (h) h.classList.add('hidden'); const b = $('bSuper'); if (b) b.classList.add('hidden'); if (fx.halo) { V().ball.scale.setScalar(1); fx.halo.visible = false; fx.flame.visible = false; fx.decoys.forEach((d) => { d.visible = false; }); fx.ice.forEach((m) => { m.visible = false; }); fx.aura.forEach((m) => { m.visible = false; }); fx.bolt.visible = false; } };
  S.draw = function (st, dt) {
    const g = G(); if (!st || !st.sm) { S.hide(); return; }
    ensureHud(); ensureFx(); const sm = st.sm, v = V(), t = v.t; $('smHud').classList.remove('hidden');
    const myT = st.players[g.me] ? st.players[g.me].team : -1, watching = myT < 0;
    [0, 1].forEach((k) => { const ch = D.smasher(sm.chars[k]); $('smI' + k).textContent = ch.icon; $('smE' + k).style.width = sm.en[k] + '%'; $('smB' + k).classList.toggle('full', sm.en[k] >= 100); $('smB' + k).classList.toggle('armed', !!sm.armed[k]); $('smS' + k).textContent = '\uD83D\uDCA5' + sm.smashes[k]; $('smE' + k).style.background = sm.en[k] >= 100 ? '' : ch.col; });
    const sb = $('bSuper'); sb.classList.toggle('hidden', watching); if (!watching) { const full = sm.en[myT] >= 100; sb.classList.toggle('ready', full && !sm.armed[myT]); sb.classList.toggle('armed', !!sm.armed[myT]); $('bSupF').style.height = sm.en[myT] + '%'; const ch = D.smasher(sm.chars[myT]); sb.querySelector('i').textContent = ch.icon; sb.querySelector('b').textContent = sm.armed[myT] ? 'ARMED!' : full ? ch.sn.split(' ')[0] : 'SUPER'; }
    // ball effects
    const sp = sm.sup, b = st.ball, live = sp && b.live && !(sp.bounced && sp.kind !== 'giant');
    if (sp) sp.t = (sp.t || 0) + dt;
    const col = sp ? SUPCOL[sp.kind] : '#fff';
    fx.halo.visible = !!live; fx.halo.material.color.set(col); fx.halo.scale.setScalar(1.3 + Math.sin(t * 30) * 0.2);
    v.ball.scale.setScalar(sp && sp.kind === 'giant' && b.live ? 3.4 : 1);
    fx.flame.visible = !!(live && sp.kind === 'rocket');
    if (fx.flame.visible) { const sp2 = Math.hypot(b.vx, b.vy, b.vz) || 1; fx.flame.position.set(b.x - b.vx / sp2 * 0.3, b.y - b.vy / sp2 * 0.3, b.z - b.vz / sp2 * 0.3); fx.flame.lookAt(b.x - b.vx, b.y - b.vy, b.z - b.vz); fx.flame.rotateX(Math.PI / 2); fx.flame.scale.set(1, 1 + Math.random() * 0.6, 1); if (Math.random() < 0.6) v.burst(b.x, b.y, b.z, Math.random() < 0.5 ? '#ff7a1a' : '#9ca3af', 1, 0.6); }
    if (live && (sp.kind === 'banana' || sp.kind === 'freeze') && Math.random() < 0.5) v.burst(b.x, b.y, b.z, col, 1, 0.4);
    const dv = live && sp.kind === 'split'; fx.decoys.forEach((d, i) => { d.visible = !!dv; if (dv) { const s = (i ? 1 : -1) * Math.min(1.8, sp.t * 2.4); d.position.set(b.x + s, b.y + Math.sin(sp.t * 9 + i) * 0.15, b.z); d.rotation.x += dt * 14; } });
    fx.bolt.visible = !!(live && sp.kind === 'zap'); if (fx.bolt.visible) { const a = fx.bolt.geometry.attributes.position; for (let i = 0; i < 10; i++) { const k = i / 9; a.setXYZ(i, b.x - b.vx * k * 0.12 + (i && i < 9 ? (Math.random() - 0.5) * 0.35 : 0), b.y - b.vy * k * 0.12 + (i && i < 9 ? (Math.random() - 0.5) * 0.35 : 0), b.z - b.vz * k * 0.12); } a.needsUpdate = true; }
    // ice blocks on frozen players, aura rings on charged ones
    st.players.forEach((p, i) => { const ice = fx.ice[i], au = fx.aura[i]; if (!ice) return; const fr = sm.frozen[p.team] > 0 && !(sp && sp.kind === 'banana'); ice.visible = fr; if (fr) { ice.position.set(p.x, 1.05, p.z); ice.rotation.y = 0.3; ice.material.color.set(sp && sp.kind === 'zap' ? '#fef08a' : '#bae6fd'); ice.material.emissive.set(sp && sp.kind === 'zap' ? '#facc15' : '#38bdf8'); }
      const full = sm.en[p.team] >= 100; au.visible = full; if (full) { au.position.set(p.x, 0.04, p.z); au.scale.setScalar(1 + Math.sin(t * 8) * 0.12); au.material.color.set(sm.armed[p.team] ? '#ff4fd8' : D.smasher(sm.chars[p.team]).col); } });
  };
})();
