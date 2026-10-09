/* Grok Pickleball - ball physics (drag, spin, bounce, net + net cord) and a shot solver */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U;
  const P = PB.Phys = {};
  P.G = 9.81; P.DRAG = 0.042; P.MAG = 0.11; P.E = 0.66; P.STEP = 1 / 240;
  P.make = () => ({ x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, s: 0, sd: 0, live: false, side: 0, hold: false });
  P.copy = (b) => ({ x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, s: b.s, sd: b.sd, live: b.live, cord: b.cord, netDead: b.netDead });
  // one integration step; returns event or null: {t:'bounce'|'net'|'cord'|'post', x,z}
  P.step = function (b, dt, noNet, noGround) {
    const sp = Math.hypot(b.vx, b.vy, b.vz), vh = Math.hypot(b.vx, b.vz) || 1e-6;
    let ax = -P.DRAG * sp * b.vx, ay = -P.G - P.DRAG * sp * b.vy, az = -P.DRAG * sp * b.vz;
    ay -= P.MAG * b.s * vh;                         // topspin dips, backspin floats
    ax += P.MAG * b.sd * (b.vz / vh) * vh; az -= P.MAG * b.sd * (b.vx / vh) * vh; // side spin curves
    const oz = b.z, oy = b.y;
    b.vx += ax * dt; b.vy += ay * dt; b.vz += az * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    b.s *= (1 - 0.08 * dt); b.sd *= (1 - 0.3 * dt);
    let ev = null;
    // net
    if (!noNet && !b.netDead && ((oz > 0) !== (b.z > 0) || Math.abs(b.z) < D.BR) && Math.abs(b.x) < D.POST) {
      const crossed = (oz > 0) !== (b.z > 0);
      const f = crossed ? oz / (oz - b.z) : 0.5, y = oy + (b.y - oy) * f, h = D.netH(b.x);
      if (y - D.BR < h && crossed) {
        if (y > h - D.BR * 0.6) { // clips the tape: net cord, pops up and trickles over (or not)
          const over = y > h - D.BR * 0.1 || Math.abs(b.vz) > 7;
          b.vy = Math.abs(b.vy) * 0.25 + 0.9 + Math.random() * 0.6; b.vz *= over ? 0.28 : -0.12; b.vx *= 0.5; b.s = 0;
          b.z = over ? Math.sign(b.vz || 1) * 0.02 : Math.sign(b.vz || 1) * 0.02; b.y = Math.max(b.y, h + D.BR);
          ev = { t: 'cord', x: b.x, z: b.z };
        } else { // into the net: dead, drops on the hitter's side
          b.z = Math.sign(oz || 1) * 0.06; b.vz = -b.vz * 0.08; b.vx *= 0.25; b.vy = Math.min(b.vy, 0) * 0.3; b.s = 0; b.netDead = true;
          ev = { t: 'net', x: b.x, z: b.z };
        }
      }
    }
    if (!noGround && b.y < D.BR && b.vy < 0) {
      b.y = D.BR; b.vy = -b.vy * P.E; const k = U.clamp(0.74 + 0.06 * b.s, 0.6, 0.86);
      b.vx *= k; b.vz *= k; b.s *= 0.45; b.sd *= 0.5;
      if (b.vy < 0.35) b.vy = 0;
      ev = ev || { t: 'bounce', x: b.x, z: b.z };
    }
    return ev;
  };
  // simulate forward: returns {bounce:{x,z,t}, path:[{x,y,z,t}], netHit, cord}
  P.predict = function (b0, tmax, opt) {
    const b = P.copy(b0), dt = 1 / 120, out = { path: [], bounce: null, bounces: [] }; let t = 0;
    opt = opt || {};
    while (t < (tmax || 3)) {
      const ev = P.step(b, dt, opt.noNet); t += dt;
      if (opt.path !== false) out.path.push({ x: b.x, y: b.y, z: b.z, t, vy: b.vy, vz: b.vz });
      if (ev) { if (ev.t === 'bounce') { const bo = { x: ev.x, z: ev.z, t }; out.bounces.push(bo); if (!out.bounce) out.bounce = bo; if (out.bounces.length >= (opt.nb || 2)) break; } else if (ev.t === 'net') out.netHit = true; else if (ev.t === 'cord') out.cord = true; }
      if (Math.abs(b.z) > 40 || Math.abs(b.x) > 40) break;
    }
    return out;
  };
  // flight sim without net/bounce to find landing (y = BR) and height at net crossing
  function fly(x, y, z, vx, vy, vz, s, sd) {
    const b = { x, y, z, vx, vy, vz, s, sd }, dt = 1 / 120; let t = 0, netY = null, apex = y; const z0 = z;
    while (t < 6) {
      const oz = b.z, oy = b.y; P.step(b, dt, true, true); t += dt; apex = Math.max(apex, b.y);
      if (netY == null && (oz > 0) !== (b.z > 0)) { const f = oz / (oz - b.z); netY = oy + (b.y - oy) * f - D.netH(b.x); }
      if (b.y <= D.BR + 0.001 && b.vy <= 0 && t > 0.02) break;
    }
    return { x: b.x, z: b.z, t, netY: netY == null ? (Math.sign(z0) === Math.sign(b.z) ? -9 : 9) : netY, apex };
  }
  P.fly = fly;
  // velocity to land on (tx,tz) with horizontal speed vh; slows down (higher arc) until it clears the net by `clear`
  function shoot(from, hd, vh, vy, s, sd) { return fly(from.x, from.y, from.z, Math.sin(hd) * vh, vy, Math.cos(hd) * vh, s, sd); }
  P.solve = function (from, tx, tz, vh, s, sd, clear, minApex) {
    const want = Math.hypot(tx - from.x, tz - from.z); let speed = vh, out = null;
    for (let tries = 0; tries < 14; tries++) {
      let hd = Math.atan2(tx - from.x, tz - from.z), vy = 0, r = null;
      for (let k = 0; k < 3; k++) {
        let lo = -14, hi = 24;
        for (let it = 0; it < 22; it++) { const mid = (lo + hi) / 2; r = shoot(from, hd, speed, mid, s, sd); const d = Math.hypot(r.x - from.x, r.z - from.z); if (d < want) lo = mid; else hi = mid; }
        vy = (lo + hi) / 2; r = shoot(from, hd, speed, vy, s, sd);
        // fix sideways drift (side spin)
        const ang = Math.atan2(r.x - from.x, r.z - from.z), aim = Math.atan2(tx - from.x, tz - from.z); const e = U.ang(aim - ang); if (Math.abs(e) < 0.003) break; hd += e;
      }
      out = { vx: Math.sin(hd) * speed, vy, vz: Math.cos(hd) * speed, land: r };
      const reach = Math.hypot(r.x - tx, r.z - tz) < 0.25;
      if (reach && r.netY >= clear && (!minApex || r.apex >= minApex)) { out.ok = true; return out; }
      if (!reach && tries < 13) { speed *= 1.12; continue; } // too slow to get there
      speed *= 0.9; if (speed < 2) break;
    }
    out.ok = false; return out;
  };
})();
