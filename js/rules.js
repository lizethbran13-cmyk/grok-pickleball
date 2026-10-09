/* Grok Pickleball - official-style rules: serving rotation, side-out / rally scoring, faults, win by 2 */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D;
  const R = PB.Rules = {};
  // team 0 = near side (z > 0, faces -z, its right hand is +x); team 1 = far side (z < 0, its right is -x)
  R.sideX = (team, side) => (team === 0 ? 1 : -1) * (side === 'R' ? 1 : -1);
  R.teamOfZ = (z) => z > 0 ? 0 : 1;
  R.inKitchen = (z, pad) => Math.abs(z) < D.K + (pad || 0);
  R.inCourt = (x, z) => Math.abs(x) <= D.HW + D.BR && Math.abs(z) <= D.HL + D.BR;
  // the diagonal service box the serve must land in (lines in, except the kitchen line)
  R.inServiceBox = function (serverTeam, serverSide, x, z) {
    const rt = 1 - serverTeam; if (R.teamOfZ(z) !== rt) return false;
    const az = Math.abs(z); if (az <= D.K + D.BR * 0.2 || az > D.HL + D.BR) return false;
    if (Math.abs(x) > D.HW + D.BR) return false;
    const want = -Math.sign(R.sideX(serverTeam, serverSide)); // diagonal: opposite global x half
    return x * want >= -D.BR;
  };

  R.newGame = function (o) {
    const g = { doubles: !!o.doubles, scoring: o.scoring === 'rally' ? 'rally' : 'sideout', to: o.to || 11, winBy: 2, score: [0, 0],
      st: o.firstServe || 0, sn: 2, over: false, winner: -1, rallies: 0, log: [] };
    // positions[team] = { R: playerIdx, L: playerIdx }
    g.pos = o.doubles ? [{ R: 0, L: 1 }, { R: 2, L: 3 }] : [{ R: 0, L: 0 }, { R: 1, L: 1 }];
    if (!g.doubles || g.scoring === 'rally') g.sn = 1;
    R.setServer(g);
    return g;
  };
  // who serves from where
  R.setServer = function (g) {
    const t = g.st, sc = g.score[t];
    if (!g.doubles) { g.serverSide = sc % 2 === 0 ? 'R' : 'L'; g.server = g.pos[t].R; }
    else if (g.scoring === 'rally') { g.serverSide = sc % 2 === 0 ? 'R' : 'L'; g.server = g.pos[t][g.serverSide]; }
    else { if (g.server == null || R.teamOfPlayer(g, g.server) !== t) g.server = g.pos[t].R; g.serverSide = g.pos[t].R === g.server ? 'R' : 'L'; }
    const rt = 1 - t; g.receiver = g.doubles ? g.pos[rt][g.serverSide] : g.pos[rt].R;
    g.receiverSide = g.serverSide;
  };
  R.teamOfPlayer = (g, p) => g.doubles ? (p < 2 ? 0 : 1) : p;
  R.swap = (pos) => { const r = pos.R; pos.R = pos.L; pos.L = r; };
  R.callout = function (g) {
    const a = g.score[g.st], b = g.score[1 - g.st];
    return g.doubles && g.scoring === 'sideout' ? a + ' - ' + b + ' - ' + g.sn : a + ' - ' + b;
  };
  R.sideOf = (g, p) => { const t = R.teamOfPlayer(g, p); return g.pos[t].R === p ? 'R' : 'L'; };
  // rally won by team w; returns { point: bool, sideout: bool, over: bool }
  R.rallyWon = function (g, w, why) {
    const res = { point: false, sideout: false, secondServer: false, over: false, w, why };
    g.rallies++;
    if (g.scoring === 'rally') {
      g.score[w]++; res.point = true;
      if (w === g.st) { if (g.doubles) R.swap(g.pos[w]); }
      else { g.st = w; res.sideout = true; }
    } else if (w === g.st) {
      g.score[w]++; res.point = true; if (g.doubles) R.swap(g.pos[w]);
    } else if (g.doubles && g.sn === 1) {
      g.sn = 2; res.secondServer = true; const t = g.st; g.server = g.pos[t].R === g.server ? g.pos[t].L : g.pos[t].R;
    } else { g.st = w; g.sn = 1; g.server = null; res.sideout = true; }
    const s = g.score[w], o = g.score[1 - w];
    if (res.point && s >= g.to && s - o >= g.winBy) { g.over = true; g.winner = w; res.over = true; }
    R.setServer(g);
    g.log.push({ w, why, sc: g.score.slice(), st: g.st, sn: g.sn });
    return res;
  };

  /* ---------- rally referee: feed it hits and bounces, it calls faults ---------- */
  R.newRally = function (g) { return { hits: 0, lastTeam: -1, lastPlayer: -1, bounces: 0, bounceSide: -1, over: false, volleyT: {}, crossed: false }; };
  // returns null or { loser: team, why }
  R.onHit = function (g, r, p, info) {
    const team = R.teamOfPlayer(g, p);
    if (r.hits > 0 && r.lastTeam === team && r.bounces === 0 && !r.crossed) return { loser: team, why: 'Double hit' };
    if (r.hits > 0 && r.lastTeam === team) return { loser: team, why: 'Double hit' };
    const volley = r.hits > 0 && r.bounces === 0;
    if (r.hits > 0 && r.bounces >= 1 && r.bounceSide !== team) return { loser: 1 - team, why: 'Ball was out' };
    if (volley && r.hits < 3) return { loser: team, why: 'Two-bounce rule! Let it bounce first.' };
    if (volley && R.inKitchen(info.pz, D.BR + 0.08)) return { loser: team, why: 'Kitchen fault! No volleys in the kitchen.' };
    r.hits++; r.lastTeam = team; r.lastPlayer = p; r.bounces = 0; r.bounceSide = -1; r.crossed = false;
    if (volley) r.volleyT[p] = info.t;
    return null;
  };
  R.onCross = function (r) { r.crossed = true; };
  R.onBounce = function (g, r, x, z) {
    const side = R.teamOfZ(z);
    if (r.hits === 0) return null;
    if (r.bounces === 0) {
      if (side === r.lastTeam) return { loser: r.lastTeam, why: r.netHit ? 'Into the net' : 'Didn\u2019t clear the net' };
      if (r.hits === 1) { if (!R.inServiceBox(g.st, g.serverSide, x, z)) return { loser: r.lastTeam, why: R.inKitchen(z, D.BR * 0.2) && Math.abs(x) <= D.HW ? 'Serve landed in the kitchen' : 'Serve out' }; }
      else if (!R.inCourt(x, z)) return { loser: r.lastTeam, why: 'Out!' };
      r.bounces = 1; r.bounceSide = side; return null;
    }
    // second bounce on the same side: that side could not return it
    return { loser: r.bounceSide >= 0 ? r.bounceSide : side, why: r.hits === 1 && r.lastTeam === g.st && r.bounces === 1 ? 'Ace!' : 'Winner!', winner: true };
  };
  // momentum rule: a player who volleyed may not step into the kitchen right after
  R.checkMomentum = function (g, r, p, pz, t) {
    const v = r.volleyT[p]; if (v == null || t - v > 0.7) return null;
    if (R.inKitchen(pz, 0.02)) return { loser: R.teamOfPlayer(g, p), why: 'Kitchen fault! Your momentum carried you into the kitchen.' };
    return null;
  };
})();
