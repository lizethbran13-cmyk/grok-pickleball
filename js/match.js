/* Grok Pickleball - match simulation (no rendering): players, AI, shots, serve flow, referee hookup.
   Runs the same headless (tests / AI balance sims) and in the game. Host-authoritative online. */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U, Ph = PB.Phys, R = PB.Rules;
  const gauss = (rnd) => { let s = 0; for (let i = 0; i < 4; i++) s += rnd(); return (s - 2) / 0.577; };
  const HUMAN_SPEED = 5.0, ASSIST_SPEED = 4.3, AI_BASE_SPEED = 5.0, ACC = 22;

  function Match(o) {
    this.o = o = Object.assign({ doubles: false, scoring: 'sideout', to: 11, court: 'park', practice: false }, o);
    this.rnd = o.seed != null ? U.rng(o.seed) : Math.random;
    this.t = 0; this.ev = []; this.rec = []; this.recT = 0; this.hooks = o.hooks || {};
    this.ball = Ph.make(); this.phase = 'pre'; this.phaseT = 0; this.hitsLog = [];
    const n = o.doubles ? 4 : 2;
    this.players = [];
    for (let i = 0; i < n; i++) {
      const pd = (o.players && o.players[i]) || { ctrl: 'ai', diff: 'medium' };
      const team = o.doubles ? (i < 2 ? 0 : 1) : i;
      this.players.push({ i, team, name: pd.name || 'Player', ctrl: pd.ctrl || 'ai', diff: pd.diff || 'medium', ai: Object.assign({}, D.DIFF[pd.diff || 'medium']), style: Object.assign({ dink: 1, drive: 1, lob: 1, smash: 1 }, pd.style || {}),
        look: pd.look || {}, pid: pd.pid || null, assist: pd.assist !== false, x: 0, z: team === 0 ? 6 : -6, vx: 0, vz: 0, face: team === 0 ? Math.PI : 0, tx: 0, tz: 0,
        req: null, input: { mx: 0, mz: 0 }, plan: null, planHit: -1, reactT: 0, swingT: 9, swingType: '', swingSide: 1, lastHitT: -9, celebT: 0, emote: null, stats: { hits: 0, winners: 0, errors: 0 } });
    }
    this.slowAI = !!o.slowAI; // assist mode -> AI reacts a bit slower
    this.game = R.newGame({ doubles: o.doubles, scoring: o.scoring, to: o.to, firstServe: o.firstServe || 0 });
    this.rally = R.newRally(this.game);
    this.setPhase('pre');
  }
  const M = Match.prototype;
  PB.Match = Match;
  M.emit = function (t, d) { const e = Object.assign({ t, at: this.t }, d || {}); this.ev.push(e); if (this.ev.length > 200) this.ev.shift(); if (this.hooks.ev) this.hooks.ev(e); };
  M.teamPlayers = function (t) { return this.players.filter((p) => p.team === t); };
  M.dirZ = (team) => team === 0 ? -1 : 1; // direction a team hits toward
  M.setPhase = function (ph) { this.phase = ph; this.phaseT = 0; if (ph === 'pre') { this.placeForServe(); this.emit('callout', { text: R.callout(this.game), server: this.game.server, st: this.game.st, sn: this.game.sn }); } };

  /* ---------- serve formation ---------- */
  M.servePos = function (p) {
    const g = this.game, s = this.o.doubles ? R.sideOf(g, p.i) : (p.team === g.st ? g.serverSide : g.receiverSide);
    const sx = R.sideX(p.team, s) * (this.o.doubles ? 1.5 : 1.3), back = p.team === 0 ? 1 : -1;
    if (p.i === g.server) return { x: sx, z: back * (D.HL + 0.35) };
    if (p.i === g.receiver) return { x: sx, z: back * (D.HL + 0.25) };
    if (p.team === g.st) return { x: sx, z: back * (D.HL + 0.2) };  // server's partner stays back
    return { x: sx, z: back * (D.K + 0.45) };                       // receiver's partner at the kitchen line
  };
  M.placeForServe = function () {
    this.rally = R.newRally(this.game); const b = this.ball; b.live = false; b.netDead = false; b.cord = false;
    this.players.forEach((p) => { const sp = this.servePos(p); p.x = sp.x; p.z = sp.z; p.vx = p.vz = 0; p.tx = sp.x; p.tz = sp.z; p.face = p.team === 0 ? Math.PI : 0; p.req = null; p.plan = null; p.planHit = -1; p.swingT = 9; });
    this.holdBall();
  };
  M.holdBall = function () { const g = this.game, s = this.players[g.server], b = this.ball; b.x = s.x - Math.sign(s.x || 1) * 0.15; b.z = s.z + this.dirZ(s.team) * 0.55; b.y = 0.72; b.vx = b.vy = b.vz = 0; b.s = 0; b.sd = 0; };

  /* ---------- input (humans: local or remote) ---------- */
  // type: auto|dink|drive|lob|smash ; ax: -1.3..1.3 aim left/right (as the player sees it) ; pow 0..1
  M.request = function (pi, type, ax, pow) { const p = this.players[pi]; if (!p) return; p.req = { type: type || 'auto', ax: U.clamp(+ax || 0, -1.4, 1.4), pow: U.clamp(pow == null ? 0.55 : +pow, 0, 1), t: this.t }; p.swingT = Math.min(p.swingT, 9); };
  M.move = function (pi, mx, mz) { const p = this.players[pi]; if (p) { p.input.mx = U.clamp(+mx || 0, -1, 1); p.input.mz = U.clamp(+mz || 0, -1, 1); } };

  /* ---------- main update ---------- */
  M.update = function (dt) {
    dt = Math.min(dt, 0.05); const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
    for (let i = 0; i < steps; i++) this.tick(h);
    this.recT += dt; if (this.recT >= 1 / 30) { this.recT = 0; this.record(); }
  };
  M.tick = function (dt) {
    this.t += dt; this.phaseT += dt; const g = this.game;
    this.players.forEach((p) => { p.swingT += dt; if (p.celebT > 0) p.celebT -= dt; });
    if (this.phase === 'pre') { if (this.phaseT > (this.o.practice ? 0.2 : 1.25)) this.setPhase('serve'); this.movePlayers(dt, true); return; }
    if (this.phase === 'serve') {
      this.holdBall(); const s = this.players[g.server];
      if (this.hooks.serve && this.hooks.serve(this, s)) return;
      if (s.ctrl === 'ai') { if (this.phaseT > 0.9 + (this.rnd() * 0.6)) this.aiServe(s); }
      else if (s.req && this.phaseT > 0.15) { const r = s.req; s.req = null; this.doServe(s, r.ax, r.pow); }
      else if (s.ctrl !== 'ai' && this.o.autoServeAfter && this.phaseT > this.o.autoServeAfter) this.doServe(s, 0, 0.5);
      this.movePlayers(dt, true); return;
    }
    if (this.phase === 'dead') { this.stepBall(dt, true); this.movePlayers(dt); if (this.phaseT > (this.o.practice ? 0.6 : 1.7)) { if (g.over) { this.phase = 'over'; this.emit('over', { winner: g.winner, score: g.score.slice() }); } else if (!this.o.practice) this.setPhase('pre'); } return; }
    if (this.phase === 'over' || this.phase === 'idle') { this.stepBall(dt, true); this.movePlayers(dt); return; }
    // rally
    this.stepBall(dt);
    if (this.phase !== 'rally') return;
    this.think(dt);
    this.movePlayers(dt);
    for (const p of this.players) {
      if (this.phase !== 'rally') break;
      const f = R.checkMomentum(g, this.rally, p.i, p.z, this.t); if (f) { this.fault(f, p); break; }
      this.tryHit(p);
    }
    if (this.phase === 'rally' && this.t - this.lastHitT > 7) this.fault({ loser: R.teamOfZ(this.ball.z), why: 'Ball stopped' });
  };
  M.stepBall = function (dt, dead) {
    const b = this.ball; if (!b.live) return;
    const oz = b.z, ev = Ph.step(b, dt);
    if (dead) { if (Math.abs(b.z) > 30) b.live = false; return; }
    if ((oz > 0) !== (b.z > 0)) { R.onCross(this.rally); this.emit('cross', {}); }
    if (!ev) return;
    if (ev.t === 'net') { this.rally.netHit = true; this.emit('net', { x: ev.x }); }
    else if (ev.t === 'cord') { b.cord = true; this.emit('cord', { x: ev.x }); }
    else if (ev.t === 'bounce') {
      const f = R.onBounce(this.game, this.rally, ev.x, ev.z);
      this.emit('bounce', { x: ev.x, z: ev.z, n: this.rally.bounces, side: R.teamOfZ(ev.z) });
      if (this.hooks.bounce && this.hooks.bounce(this, ev, f)) return;
      if (f) this.fault(f);
    }
  };
  M.fault = function (f, who) {
    if (this.phase !== 'rally') return;
    if (this.hooks.fault && this.hooks.fault(this, f, who)) return;
    this.endRally(1 - f.loser, f.why, f);
  };
  M.endRally = function (w, why, f) {
    const g = this.game, r = this.rally, last = this.players[r.lastPlayer];
    if (this.o.practice) { this.phase = 'dead'; this.phaseT = 0; this.emit('point', { w, why, practice: true }); return; }
    const great = r.hits >= 12 || (f && f.winner && last && last.swingType === 'smash' && r.hits >= 3) || (this.ball.cord && f && f.winner) || (last && last.lastShotFlags && last.lastShotFlags.erne);
    if (last && f && f.winner && last.team === w) last.stats.winners++;
    else if (last && last.team !== w) last.stats.errors++;
    const prevServer = g.server, res = R.rallyWon(g, w, why);
    this.phase = 'dead'; this.phaseT = 0;
    this.teamPlayers(w).forEach((p) => { p.celebT = res.over ? 3.5 : 1.0; });
    this.emit('point', { w, why, res, score: g.score.slice(), hits: r.hits, great: !!great, callout: R.callout(g), lastShot: last ? last.swingType : '', prevServer, winnerShot: !!(f && f.winner) });
    if (great) this.emit('great', { from: this.rallyStartT, to: this.t });
  };

  /* ---------- serving ---------- */
  M.aiServe = function (p) {
    const a = p.ai, rnd = this.rnd; let ax = (rnd() - 0.5) * 1.6 * a.smart, pow = 0.45 + rnd() * 0.5 * a.power;
    this.doServe(p, ax, pow, rnd() < a.err * 0.6);
  };
  M.doServe = function (p, ax, pow, miss) {
    const g = this.game, b = this.ball, dir = this.dirZ(p.team), side = g.serverSide;
    const want = -Math.sign(R.sideX(p.team, side)); // global x half of the diagonal box
    const sideSign = p.team === 0 ? 1 : -1; // player's right in global x
    let tx = want * D.HW * 0.5 + ax * sideSign * D.HW * 0.32, depth = D.K + 1.7 + pow * 2.0;
    const human = p.ctrl !== 'ai', help = human && p.assist;
    if (!human || help) { tx = U.clamp(tx, want > 0 ? 0.3 : -D.HW + 0.3, want > 0 ? D.HW - 0.3 : -0.3); depth = U.clamp(depth, D.K + 0.8, D.HL - 0.4); }
    const err = human ? (help ? 0.12 : 0.3) : p.ai.aim * 0.35;
    tx += gauss(this.rnd) * err; depth += gauss(this.rnd) * err;
    if (miss) { if (this.rnd() < 0.5) depth = D.HL + 0.5 + this.rnd(); else tx = want * (D.HW + 0.4); }
    b.x = p.x - sideSign * 0.25 * (p.team === 0 ? 1 : -1) * 0; b.y = 0.7; b.z = p.z + dir * 0.5;
    const v = Ph.solve(b, tx, dir * depth, 11 + pow * 4, 0.6, 0, miss && this.rnd() < 0.3 ? -0.2 : 0.3);
    Object.assign(b, { vx: v.vx, vy: v.vy, vz: v.vz, s: 0.6, sd: 0, live: true, netDead: false, cord: false });
    this.rally = R.newRally(g); R.onHit(g, this.rally, p.i, { pz: p.z, t: this.t });
    p.swingT = 0; p.swingType = 'serve'; p.swingSide = 1; p.stats.hits++; this.lastHitT = this.t; this.rallyStartT = this.t;
    this.phase = 'rally'; this.phaseT = 0;
    this.emit('hit', { p: p.i, type: 'serve', pow, speed: Math.hypot(v.vx, v.vy, v.vz), volley: false });
    if (this.hooks.hit) this.hooks.hit(this, p, 'serve');
  };

  /* ---------- hitting ---------- */
  M.reach = (p) => (p.ctrl === 'ai' ? 1.18 * p.ai.reach : 1.25);
  M.mustBounce = function () { const r = this.rally; return r.hits > 0 && r.hits < 3 && r.bounces === 0; };
  M.canHit = function (p) {
    const b = this.ball, r = this.rally; if (!b.live || b.netDead) return false;
    if (r.lastTeam === p.team) return false;
    const toward = p.team === 0 ? (b.z > -0.2 && (b.vz > 0 || b.z > 0.3)) : (b.z < 0.2 && (b.vz < 0 || b.z < -0.3));
    if (!toward) return false;
    if (r.bounces >= 1 && r.bounceSide !== p.team) return false;
    const d = Math.hypot(b.x - p.x, b.z - p.z);
    const top = p.ctrl === 'ai' ? 2.35 + 0.25 * p.ai.reach : 2.6;
    return d <= this.reach(p) && b.y > 0.06 && b.y < top;
  };
  M.tryHit = function (p) {
    if (p.swingT < 0.18 || p.noHit) return;
    if (!this.canHit(p)) return;
    const b = this.ball, r = this.rally, volley = r.bounces === 0;
    if (p.ctrl === 'ai') {
      if (this.mustBounce()) return;
      if (volley && R.inKitchen(p.z, D.BR + 0.1) && !p.slipK) return;
      // wait for a comfy height unless the ball is about to get past
      const pass = this.passing(p);
      if (!pass && b.y > 1.25 && !(this.wantsSmash(p) && b.y > 1.5) && b.vy > -1 && volley) return;
      if (!pass && !volley && b.vy > 0.4 && b.y < 0.55) return; // let it rise after the bounce
      this.hit(p, this.aiShot(p));
      return;
    }
    // human
    const q = p.req; if (!q) return;
    const age = this.t - q.t, win = p.assist ? 1.1 : 0.5;
    if (age > win) { p.req = null; return; }
    if (p.assist) {
      if (this.mustBounce()) { if (!p.warnedBounce) { p.warnedBounce = true; this.emit('hint', { p: p.i, text: 'Let it bounce first! (two-bounce rule)' }); } return; }
      if (volley && R.inKitchen(p.z, D.BR + 0.1)) { this.emit('hint', { p: p.i, text: 'Kitchen! Wait for the bounce.', kitchen: true }); return; }
      const pass = this.passing(p);
      if (!pass && volley && b.y > 1.3 && q.type !== 'smash' && !(q.type === 'auto' && b.y > 1.7) && b.vy > -1) return;
      if (!pass && !volley && b.vy > 0.4 && b.y < 0.55) return;
    }
    p.req = null;
    const quality = p.assist ? 1 : U.clamp(1 - Math.abs(age - 0.12) / 0.45, 0.2, 1);
    this.hit(p, this.resolveReq(p, q, quality));
  };
  M.passing = function (p) { const b = this.ball, dz = b.z - p.z, dirIn = p.team === 0 ? 1 : -1; const next = Math.hypot(b.x + b.vx * 0.05 - p.x, b.z + b.vz * 0.05 - p.z); return next > this.reach(p) * 0.85 || dz * dirIn > 0.25 || b.y < 0.22; };
  M.wantsSmash = function (p) { return Math.abs(p.z) < D.HL - 0.6; };
  // turn a human request into a concrete shot
  M.resolveReq = function (p, q, quality) {
    q = q || { type: 'auto', ax: 0, pow: 0.5 };
    const b = this.ball; let type = q.type;
    if (type === 'auto') type = this.autoType(p, q.pow);
    if (type === 'smash' && b.y < 1.25) type = 'drive';
    const sideSign = p.team === 0 ? 1 : -1;
    let tx = q.ax * sideSign * D.HW * 0.75;
    if (q.type !== 'auto' && Math.abs(q.ax) < 0.05 && p.assist) tx = this.openX(p); // buttons: aim help picks the open space
    else if (q.type === 'auto' && Math.abs(q.ax) < 0.12 && p.assist) tx = this.openX(p) * 0.8;
    return { type, tx, pow: q.pow, quality: quality == null ? 1 : quality, help: p.assist, human: true };
  };
  M.autoType = function (p, pow) {
    const b = this.ball, r = this.rally, az = Math.abs(p.z);
    if (b.y > 1.7 && az < D.HL - 0.5) return 'smash';
    if (r.hits === 2 && az > 4.5) return pow > 0.62 ? 'drive' : 'dink'; // third shot: drop it (or drive with a long swipe)
    if (az < D.K + 1.3 && b.y < 1.1) return pow > 0.75 ? 'drive' : 'dink';
    return pow < 0.25 ? 'dink' : 'drive';
  };
  // x on the other side furthest from the opponents
  M.openX = function (p) {
    const opp = this.teamPlayers(1 - p.team); let best = 0, bs = -1;
    for (let x = -D.HW + 0.5; x <= D.HW - 0.5; x += 0.25) { let s = 9; opp.forEach((o) => { s = Math.min(s, Math.abs(o.x - x)); }); s -= Math.abs(x) * 0.18; if (s > bs) { bs = s; best = x; } }
    return best;
  };
  // AI picks a shot by situation + personality
  M.aiShot = function (p) {
    const a = p.ai, st = p.style, b = this.ball, r = this.rally, rnd = this.rnd, az = Math.abs(p.z);
    const opp = this.teamPlayers(1 - p.team), oppNet = opp.every((o) => Math.abs(o.z) < D.K + 1.4), oppBack = opp.every((o) => Math.abs(o.z) > D.HL - 1.5);
    const w = { dink: 0, drive: 0, lob: 0, smash: 0 };
    if (b.y > 1.5 && az < D.HL - 0.4) { w.smash = 2.5 * (st.smash || 1) * (0.4 + a.smart); w.drive = 0.8; }
    else if (r.hits === 2) { w.dink = 2.2 * a.smart * st.dink; w.drive = 1.4 * st.drive; w.lob = 0.25 * st.lob; } // third shot: drop or drive
    else if (az < D.K + 1.2) { w.dink = (oppNet ? 2.5 : 0.8) * st.dink; w.drive = (b.y > 0.95 ? 1.6 : 0.5) * st.drive; w.lob = (oppNet ? 0.3 : 0.1) * st.lob; }
    else { w.drive = 1.4 * st.drive; w.dink = 0.9 * st.dink * a.smart; w.lob = (oppNet ? 0.6 : 0.25) * st.lob; if (oppBack) w.dink += 0.8 * a.smart; }
    if (r.hits === 1) { w.drive += 1.2; w.lob += 0.3 * st.lob; w.dink *= 0.3; w.smash = 0; }
    // dumb picks for weak AI sometimes
    if (rnd() > a.smart) { const k = ['dink', 'drive', 'lob']; const pick = k[Math.floor(rnd() * 3)]; w[pick] += 1.5; }
    let tot = 0; for (const k in w) tot += w[k]; let x = rnd() * tot, type = 'drive'; for (const k in w) { x -= w[k]; if (x <= 0) { type = k; break; } }
    let tx = rnd() < a.smart ? this.openX(p) : (rnd() - 0.5) * D.HW * 1.2;
    if (type === 'dink' && rnd() < a.smart * 0.6) tx = (opp[0].x + (opp[1] ? opp[1].x : opp[0].x)) / 2 + (rnd() - 0.5) * 1.2; // dink to the middle
    const marg = 0.3 + a.aim * 0.7; tx = U.clamp(tx, -D.HW + marg, D.HW - marg);
    const pow = U.clamp(0.3 + rnd() * 0.45 * a.power + (type === 'drive' ? 0.1 : 0), 0, 1);
    return { type, tx, pow, quality: 1, ai: true, marg };
  };
  M.hit = function (p, shot) {
    const g = this.game, b = this.ball, r = this.rally, rnd = this.rnd, dir = this.dirZ(p.team);
    const f = R.onHit(g, r, p.i, { pz: p.z, t: this.t });
    const volley = !!r.volleyT[p.i] && Math.abs(r.volleyT[p.i] - this.t) < 1e-6;
    p.swingT = 0; p.swingType = shot.type; p.swingSide = ((b.x - p.x) * (p.team === 0 ? 1 : -1)) >= 0 ? 1 : -1; p.stats.hits++; this.lastHitT = this.t; p.warnedBounce = false;
    if (f) { this.emit('hit', { p: p.i, type: shot.type, pow: 0.5, volley: true, speed: 6 }); b.vx *= -0.2; b.vz = -dir * 2; b.vy = 1.5; this.fault(f, p); return; }
    // shot params
    let { type, tx, pow } = shot; const fromDeep = Math.abs(p.z) > 4.2;
    let depth, vh, s, sd = 0, clear, minApex = 0;
    if (type === 'dink') { if (fromDeep) { depth = 1.0 + pow * 1.1; vh = 8.6 + pow * 1.2; s = -0.3; clear = shot.ai ? 0.06 + (1 - p.ai.smart) * 0.35 : 0.1 + (shot.help ? 0.12 : 0); } else { depth = 0.75 + pow * 1.15; vh = 3.8 + pow * 1.8; s = -0.4; clear = 0.12; } }
    else if (type === 'lob') { depth = 5.0 + pow * 1.3; vh = 8.4 + pow * 1.6; s = 0.5; clear = 2.4; minApex = 4.0; }
    else if (type === 'smash') { depth = 3.0 + pow * 3.0; vh = 14 + pow * 7; s = 0.9; clear = 0.06; }
    else { depth = 4.6 + pow * 1.6; vh = 10.5 + pow * 6; s = 1.3; clear = 0.12; }
    let tz = dir * depth;
    // errors: humans by timing (assist trims it), AI by difficulty; pressure from fast/low balls
    const inSpeed = Math.hypot(b.vx, b.vy, b.vz), pressure = U.clamp((inSpeed - 9) / 12, 0, 1) * 0.6 + (b.y < 0.3 ? 0.4 : 0) + (type === 'smash' ? 0.2 : 0) + (type === 'drive' && pow > 0.85 ? 0.3 : 0);
    let es, miss = false; const tired = 1 + Math.max(0, r.hits - (this.o.doubles ? 6 : 9)) * (this.o.doubles ? 0.2 : 0.14) + (this.o.doubles ? 0.5 : 0);
    if (shot.ai) { const a = p.ai; es = a.aim * (0.7 + pressure * 0.6); miss = rnd() < a.err * (0.6 + pressure * 2.6) * tired; if (this.slowAI) es *= 1.08; vh *= a.pace; }
    else { es = (shot.help ? 0.42 : 0.4) + (1 - shot.quality) * (shot.help ? 0.3 : 1.1) + pressure * (shot.help ? 0.3 : 0.35); vh *= shot.help ? 0.9 : 1; miss = rnd() < (shot.help ? 0.035 : 0.02) * (0.6 + pressure * 2.6) * tired; }
    if (shot.help) { tx = U.clamp(tx, -D.HW + 0.35, D.HW - 0.35); }
    if (shot.ai && type !== 'dink') { const lim = D.HL - 0.35 - shot.marg; if (Math.abs(tz) > lim) tz = dir * lim; }
    tx += gauss(rnd) * es; tz += dir * gauss(rnd) * es * (type === 'dink' ? 0.5 : 1);
    if (shot.help) { tx = U.clamp(tx, -D.HW + 0.2, D.HW - 0.2); const az = Math.abs(tz); tz = dir * U.clamp(az, 0.5, D.HL - 0.25); }
    if (miss) { const m = rnd(); if (m < 0.4) clear = -0.25; else if (m < 0.75) tz = dir * (D.HL + 0.4 + rnd() * 1.2); else tx = Math.sign(tx || 1) * (D.HW + 0.3 + rnd()); }
    if (type === 'dink' && Math.abs(tz) > D.K - 0.1 && !fromDeep && !miss && shot.help) tz = dir * (D.K - 0.3);
    sd = (rnd() - 0.5) * 0.4;
    const from = { x: b.x, y: Math.max(0.15, b.y), z: b.z };
    const v = Ph.solve(from, tx, tz, vh, s, sd, clear, minApex);
    if (clear < 0) { v.vy -= 0.6; } // the miss-hit really finds the net
    Object.assign(b, { y: from.y, vx: v.vx, vy: v.vy, vz: v.vz, s, sd, cord: false });
    p.lastShotFlags = { erne: Math.abs(p.x) > D.HW + 0.2 && volley };
    const speed = Math.hypot(v.vx, v.vy, v.vz);
    this.emit('hit', { p: p.i, type, pow, volley, speed, x: b.x, y: b.y, z: b.z, erne: p.lastShotFlags.erne, perfect: shot.human && shot.quality > 0.9 && !shot.help });
    if (this.hooks.hit) this.hooks.hit(this, p, type, volley);
  };

  // practice / drills: a ball machine (or a feeder player) sends a shot; rally.hits preset so the bounce rules fit the drill
  M.feed = function (o) {
    const b = this.ball, g = this.game; this.rally = R.newRally(g); this.rally.hits = o.hits == null ? 3 : o.hits; this.rally.lastTeam = o.team; this.rally.lastPlayer = o.p == null ? -1 : o.p;
    b.x = o.x; b.y = o.y || 0.9; b.z = o.z; const v = Ph.solve(b, o.tx, o.tz, o.vh || 8, o.s == null ? 0.3 : o.s, 0, o.clear == null ? 0.2 : o.clear, o.minApex || 0);
    Object.assign(b, { vx: v.vx, vy: v.vy, vz: v.vz, s: o.s == null ? 0.3 : o.s, sd: 0, live: true, netDead: false, cord: false });
    if (o.p != null) { const fp = this.players[o.p]; fp.swingT = 0; fp.swingType = o.type || 'drive'; }
    this.players.forEach((p) => { p.plan = null; p.planHit = -1; });
    this.phase = 'rally'; this.phaseT = 0; this.lastHitT = this.t; this.rallyStartT = this.t;
    this.emit('hit', { p: o.p == null ? -1 : o.p, type: o.type || 'drive', pow: 0.5, speed: Math.hypot(v.vx, v.vy, v.vz), feed: true });
  };

  /* ---------- AI + auto-move brain ---------- */
  M.auto = function (p) { return p.ctrl === 'ai' || p.assist; };
  M.think = function (dt) {
    const r = this.rally, b = this.ball;
    const incomingTeam = r.lastTeam === 0 ? 1 : 0;
    this.players.forEach((p) => {
      if (p.reactT > 0) p.reactT -= dt;
      if (p.team !== incomingTeam) { p.plan = null; p.planHit = -1; p.tgt = this.readySpot(p); p.autoHit = false; return; }
      if (p.planHit !== r.hits) { p.planHit = r.hits; p.plan = null; p.slipK = false; const eta = Math.abs(p.z - b.z) / Math.max(4, Math.abs(b.vz)); p.reactT = p.ctrl === 'ai' ? (p.ai.react * (this.slowAI ? 1.3 : 1) + this.rnd() * 0.08) * U.clamp(eta / 0.9, 0.3, 1) : 0.2 * U.clamp(eta / 0.9, 0.4, 1); p.autoHit = false; }
    });
    const mates = this.teamPlayers(incomingTeam);
    // plan intercepts
    mates.forEach((p) => { if (p.reactT <= 0 && !p.plan) p.plan = this.intercept(p) || { none: true }; });
    // decide who takes it (doubles)
    let taker = mates[0];
    if (mates.length > 1) {
      const [a, c] = mates, pa = a.plan, pc = c.plan;
      const human = mates.find((m) => m.ctrl !== 'ai' && !m.assist);
      if (human) { const other = mates.find((m) => m !== human), pl = other.plan; taker = pl && !pl.none && (Math.sign(pl.x || 0.01) === Math.sign(this.servePosSide(other)) || Math.hypot(pl.x - human.x, pl.z - human.z) > 2.6) ? other : human; }
      else if (pa && pc && !pa.none && !pc.none) taker = pa.slack >= pc.slack - 0.05 ? (Math.abs(pa.slack - pc.slack) < 0.12 ? (Math.abs(pa.x - a.x) < Math.abs(pc.x - c.x) ? a : c) : a) : c;
      else if (pc && !pc.none) taker = c; else if (pa && !pa.none) taker = a; else taker = Math.hypot(b.x - a.x, b.z - a.z) < Math.hypot(b.x - c.x, b.z - c.z) ? a : c;
    }
    mates.forEach((p) => {
      if (p === taker && p.plan && !p.plan.none) { p.tgt = { x: p.plan.x - (p.team === 0 ? 0.32 : -0.32), z: p.plan.z + (p.team === 0 ? 0.18 : -0.18) }; p.autoHit = true; }
      else if (p === taker && p.reactT <= 0) { p.tgt = { x: b.x, z: p.team === 0 ? Math.max(0.6, b.z) : Math.min(-0.6, b.z) }; p.autoHit = true; }
      else if (p !== taker) { p.tgt = this.readySpot(p, true); p.autoHit = false; }
    });
  };
  M.servePosSide = function (p) { return R.sideX(p.team, R.sideOf(this.game, p.i)); };
  // ready position between shots: kitchen line when it's smart, back otherwise
  M.readySpot = function (p, partnerCovering) {
    const r = this.rally, b = this.ball, back = p.team === 0 ? 1 : -1, smart = p.ctrl === 'ai' ? p.ai.smart : 0.9;
    const servingTeam = this.game.st;
    let z;
    const canAdvance = p.team === servingTeam ? r.hits >= 3 || (r.hits >= 2 && r.lastTeam === p.team) : r.hits >= 2 || (r.hits >= 1 && p.i !== this.game.receiver) || r.lastTeam === p.team;
    if (!canAdvance) z = back * (D.HL + 0.5);
    else z = back * (smart > 0.4 ? D.K + 0.35 : D.K + 1.6 + (1 - smart) * 1.5);
    const opp = this.teamPlayers(1 - p.team), oppNet = opp.every((o) => Math.abs(o.z) < D.K + 1.5);
    if (canAdvance && b.vy > 0 && b.y > 2.6 && r.lastTeam !== p.team) z = back * (D.HL - 0.8); // incoming lob, back up
    let x;
    if (this.o.doubles) x = this.servePosSide(p) * 1.35 + b.x * 0.3; else x = b.x * 0.4;
    void oppNet; void partnerCovering;
    return { x: U.clamp(x, -D.HW, D.HW), z };
  };
  // where/when this player can meet the ball
  M.intercept = function (p) {
    const b = this.ball, r = this.rally, pr = Ph.predict(b, 3.2, { nb: 2 }); const path = pr.path;
    const mustB = r.hits > 0 && r.hits < 3 && r.bounces === 0;
    const spd = this.speedOf(p); let firstB = -1;
    for (let i = 0; i < path.length; i++) if (pr.bounce && path[i].t >= pr.bounce.t) { firstB = i; break; }
    if (pr.bounce && R.teamOfZ(pr.bounce.z) === p.team && !R.inCourt(pr.bounce.x, pr.bounce.z) && r.bounces === 0 && (p.ctrl === 'ai' ? this.rnd() < 0.85 + p.ai.smart * 0.15 : p.assist)) {
      if (!this.mustBounce() || true) { p.letGo = true; return { none: true, out: true }; } // it's going out: let it go
    }
    p.letGo = false;
    p.slipK = p.ctrl === 'ai' && this.rnd() < p.ai.kitchenSlip; const avoidK = !p.slipK;
    let best = null;
    for (let i = 0; i < path.length; i += 2) {
      const q = path[i]; if (R.teamOfZ(q.z) !== p.team) continue;
      const after = firstB >= 0 && i >= firstB;
      if (pr.bounces[1] && q.t >= pr.bounces[1].t) break;
      if (mustB && !after) continue;
      if (!after && (q.y < 0.3 || q.y > 1.9)) continue;
      if (after && (q.y < 0.14 || q.y > 1.7)) continue;
      if (!after && avoidK && R.inKitchen(q.z, 0.25)) continue;
      const dist = Math.max(0, Math.hypot(q.x - p.x, q.z - p.z) - 0.65), need = dist / spd + 0.05;
      const slack = q.t - need;
      const comfy = after ? (q.vy < 0 ? 1 : 0.6) - (q.y < 0.25 ? 0.8 : 0) : 0.8;
      if (slack >= 0) { const score = (after ? 0 : (Math.abs(p.z) < D.K + 1.2 ? -0.35 : 0.3)) + i * 0.0015 - comfy * 0.1; if (!best || score < best.score) best = { x: q.x, z: q.z, t: q.t, y: q.y, slack, score, after }; }
    }
    if (!best) { // can't make it cleanly: run to the bounce anyway
      const q = pr.bounce; if (q && R.teamOfZ(q.z) === p.team) return { x: q.x, z: q.z + (p.team === 0 ? 0.6 : -0.6), t: q.t, slack: -1, late: true };
      return null;
    }
    return best;
  };
  M.speedOf = (p) => p.ctrl === 'ai' ? AI_BASE_SPEED * p.ai.speed : p.assist ? ASSIST_SPEED : HUMAN_SPEED;
  M.movePlayers = function (dt, frozen) {
    const g = this.game;
    this.players.forEach((p) => {
      let tx = p.x, tz = p.z, spd = this.speedOf(p);
      if (frozen) { const sp = this.servePos(p); tx = sp.x; tz = sp.z; }
      else if (this.auto(p) && p.tgt && !p.home) { tx = p.tgt.x; tz = p.tgt.z; if (p.reactT > 0 && p.ctrl === 'ai' && p.team !== this.rally.lastTeam) { tx = p.x; tz = p.z; } }
      let wantVx, wantVz;
      const steer = p.ctrl !== 'ai' && (Math.abs(p.input.mx) + Math.abs(p.input.mz) > 0.15);
      if (p.home && !frozen) { tx = p.home.x; tz = p.home.z; }
      if (!frozen && (!this.auto(p) || steer)) { // manual joystick (assist: steering overrides auto-move): mx right, mz forward (toward the net) from the player's view
        const fx = p.team === 0 ? 1 : -1; wantVx = p.input.mx * fx * spd; wantVz = -p.input.mz * fx * spd;
      } else {
        const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        const v = d < 0.03 ? 0 : Math.min(spd, d * 6); wantVx = d > 0 ? dx / d * v : 0; wantVz = d > 0 ? dz / d * v : 0;
      }
      const ax = U.clamp(wantVx - p.vx, -ACC * dt, ACC * dt), az = U.clamp(wantVz - p.vz, -ACC * dt, ACC * dt);
      p.vx += ax; p.vz += az; p.x += p.vx * dt; p.z += p.vz * dt;
      // stay on your side; assist keeps you out of the kitchen when a volley is coming
      if (p.team === 0) p.z = U.clamp(p.z, 0.35, D.HL + 3.5); else p.z = U.clamp(p.z, -D.HL - 3.5, -0.35);
      p.x = U.clamp(p.x, -D.HW - 2.6, D.HW + 2.6);
      if (this.auto(p) && !frozen && this.phase === 'rally' && this.rally.lastTeam !== p.team && this.rally.bounces === 0 && !p.slipK && !(p.plan && p.plan.after)) {
        const lim = D.K + 0.14; if (Math.abs(p.z) < lim) { p.z = Math.sign(p.z) * lim; if (p.vz * Math.sign(p.z) < 0) p.vz = 0; }
      }
      const vt = this.rally.volleyT[p.i]; if (this.auto(p) && !frozen && vt != null && this.t - vt < 0.75 && !p.slipK && Math.abs(p.z) < D.K + 0.06) { p.z = Math.sign(p.z) * (D.K + 0.06); p.vz = 0; }
      // face the ball
      const b = this.ball; const fy = Math.atan2(b.x - p.x, b.z - p.z);
      const base = p.team === 0 ? Math.PI : 0; let want = fy; if (Math.abs(U.ang(fy - base)) > 1.3) want = base + Math.sign(U.ang(fy - base)) * 1.3;
      p.face = U.lerpAng(p.face, frozen ? base : want, Math.min(1, dt * 8));
      p.spd = Math.hypot(p.vx, p.vz); void g;
    });
  };
  // kitchen warning for the HUD (assist): a volley is coming and you're near/in the kitchen
  M.kitchenDanger = function (p) { return this.phase === 'rally' && this.rally.lastTeam !== p.team && this.rally.bounces === 0 && Math.abs(p.z) < D.K + 0.6; };
  M.landing = function () { if (!this.ball.live || this.phase !== 'rally') return null; const pr = Ph.predict(this.ball, 3, { nb: 1, path: false }); return pr.bounce; };

  /* ---------- replay recording ---------- */
  M.record = function () {
    const b = this.ball; this.rec.push({ t: this.t, b: [b.x, b.y, b.z, b.live ? 1 : 0], p: this.players.map((p) => [p.x, p.z, p.face, p.swingT, p.swingType, p.swingSide, p.spd || 0, p.celebT]) });
    if (this.rec.length > 30 * 25) this.rec.shift();
  };
  M.clip = function (from, to) { return this.rec.filter((f) => f.t >= from - 0.4 && f.t <= to + 0.8); };
})();
