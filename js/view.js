/* Grok Pickleball - rendering: renderer, lights, players, ball, indicators, camera, effects, replays */
(function () {
  'use strict';
  const PB = window.PB, U = PB.U, M = PB.M, D = PB.D, T = THREE;
  const V = PB.V = { models: [], quality: 'high', shakeT: 0, shakeK: 0, t: 0, camSide: 0, camX: 0, mode: 'menu' };
  V.init = function (canvas) {
    const R = V.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    R.outputEncoding = T.LinearEncoding; R.toneMapping = T.NoToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    const sc = V.scene = new T.Scene();
    V.cam = new T.PerspectiveCamera(60, innerWidth / innerHeight, 0.2, 1500);
    V.hemi = new T.HemisphereLight('#d8efff', '#4f7a3a', 0.6); sc.add(V.hemi);
    const sun = V.sun = new T.DirectionalLight('#fff4e0', 1.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const s2 = sun.shadow.camera; s2.left = -14; s2.right = 14; s2.top = 16; s2.bottom = -16; s2.near = 2; s2.far = 90; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sc.add(sun); sc.add(sun.target);
    V.spots = [];
    // ball, shadow, trail
    V.ball = M.ball(); V.ball.traverse((m) => { if (m.isMesh) m.castShadow = true; }); sc.add(V.ball);
    V.ballShadow = new T.Mesh(new T.CircleGeometry(0.075, 18), new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })); V.ballShadow.rotation.x = -Math.PI / 2; sc.add(V.ballShadow);
    const TN = 14; V.trail = []; for (let i = 0; i < TN; i++) { const m = new T.Mesh(new T.SphereGeometry(0.055 * (1 - i / TN * 0.7), 8, 6), new T.MeshBasicMaterial({ color: '#f5ff8a', transparent: true, opacity: 0.35 * (1 - i / TN), depthWrite: false })); m.visible = false; sc.add(m); V.trail.push(m); }
    V.trailPts = [];
    // landing ring + aim target
    const ring = (col, r) => { const g = new T.Group(); const a = new T.Mesh(new T.RingGeometry(r * 0.72, r, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide })); a.rotation.x = -Math.PI / 2; g.add(a); const d = new T.Mesh(new T.CircleGeometry(r * 0.25, 20), a.material.clone()); d.rotation.x = -Math.PI / 2; g.add(d); g.position.y = 0.03; g.visible = false; sc.add(g); return g; };
    V.landRing = ring('#ffe14d', 0.32); V.aimRing = ring('#3ff0ff', 0.4);
    const ag = new T.Mesh(new T.ConeGeometry(0.16, 0.36, 4), new T.MeshBasicMaterial({ color: '#3ff0ff' })); ag.rotation.x = Math.PI; ag.position.y = 0.6; V.aimRing.add(ag); V.aimArrow = ag;
    // particles
    V.parts = []; const pg = new T.SphereGeometry(0.05, 6, 4);
    for (let i = 0; i < 90; i++) { const m = new T.Mesh(pg, new T.MeshBasicMaterial({ color: '#fff' })); m.visible = false; sc.add(m); V.parts.push({ m, life: 0 }); }
    V.confetti = []; const cg = new T.PlaneGeometry(0.12, 0.07);
    for (let i = 0; i < 120; i++) { const m = new T.Mesh(cg, new T.MeshBasicMaterial({ color: '#fff', side: T.DoubleSide })); m.visible = false; sc.add(m); V.confetti.push({ m, life: 0 }); }
    V.resize(); addEventListener('resize', V.resize);
  };
  V.setQuality = function (q) {
    V.quality = q; M.low = q === 'low';
    const R = V.renderer; R.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    R.shadowMap.enabled = q !== 'low'; V.sun.castShadow = q !== 'low';
    V.scene.traverse((m) => { if (m.material) { const a = Array.isArray(m.material) ? m.material : [m.material]; a.forEach((x) => { x.needsUpdate = true; }); } });
    V.resize();
  };
  V.resize = function () { const R = V.renderer; if (!R) return; R.setSize(innerWidth, innerHeight, false); V.cam.aspect = innerWidth / innerHeight; V.cam.updateProjectionMatrix(); };

  /* ---------- venue ---------- */
  V.setCourt = function (id) {
    if (V.court && V.court.userData.id === id && V.court.userData.q === V.quality) return;
    if (V.court) { V.scene.remove(V.court); V.court.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); }
    V.spots.forEach((s) => { V.scene.remove(s); V.scene.remove(s.target); }); V.spots = [];
    const c = V.court = PB.Courts.build(id); c.userData.id = id; c.userData.q = V.quality; V.scene.add(c);
    const env = c.userData.env;
    V.hemi.color.set(env.hemi[0]); V.hemi.groundColor.set(env.hemi[1]); V.hemi.intensity = env.hemi[2];
    V.sun.color.set(env.sun.col); V.sun.intensity = env.sun.k; V.sun.position.set(env.sun.pos[0], env.sun.pos[1], env.sun.pos[2]); V.sun.target.position.set(0, 0, 0);
    V.scene.fog = new T.Fog(env.fog[0], env.fog[1], env.fog[2]); V.scene.background = new T.Color(env.bg);
    (env.spots || []).forEach((p) => { const s = new T.SpotLight('#ffffff', 0.9, 40, 0.75, 0.5, 1); s.position.set(p[0], p[1], p[2]); s.target.position.set(0, 0, 0); V.scene.add(s); V.scene.add(s.target); V.spots.push(s); });
    // live scoreboard (gym)
    V.board = null;
    if (c.userData.board) { const bd = c.userData.board, cv = document.createElement('canvas'); cv.width = 512; cv.height = 210; const tex = new T.CanvasTexture(cv); const m = new T.Mesh(new T.PlaneGeometry(bd.w, bd.h), new T.MeshBasicMaterial({ map: tex })); m.position.set(bd.x, bd.y, bd.z); c.add(m); V.board = { cv, tex, last: '' }; }
    V.envName = id;
  };
  V.setBoard = function (a, b, na, nb) {
    if (!V.board) return; const key = a + ':' + b + na + nb; if (key === V.board.last) return; V.board.last = key;
    const x = V.board.cv.getContext('2d'); x.fillStyle = '#0b0f1a'; x.fillRect(0, 0, 512, 210); x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillStyle = '#ffe14d'; x.fillText('GROK PICKLEBALL', 256, 40);
    x.font = 'bold 26px Arial'; x.fillStyle = '#9be7ff'; x.fillText(String(na).slice(0, 12), 128, 80); x.fillText(String(nb).slice(0, 12), 384, 80);
    x.font = 'bold 110px Arial'; x.fillStyle = '#ff4747'; x.fillText(a, 128, 190); x.fillText(b, 384, 190); V.board.tex.needsUpdate = true;
  };

  /* ---------- players ---------- */
  V.setPlayers = function (looks, o) {
    V.models.forEach((m) => V.scene.remove(m)); V.models = []; V.lastPlayers = [looks, o];
    looks.forEach((lk, i) => { const m = M.athlete(lk);
      if (o) { const team = o.doubles ? (i < 2 ? 0 : 1) : i, me = i === o.me, col = me ? '#ffe14d' : team === 0 ? '#3b82f6' : '#ef4444';   // team ring at the feet (yellow = you)
        const rg = new T.Mesh(new T.RingGeometry(me ? 0.36 : 0.32, me ? 0.46 : 0.4, 28), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false, side: T.DoubleSide })); rg.rotation.x = -Math.PI / 2; rg.position.y = 0.025; rg.userData.glow = true; m.add(rg); } m.traverse((o) => { if (o.isMesh) o.castShadow = V.quality !== 'low' && !o.userData.glow; }); if (V.quality !== 'low') M.outline(m); V.scene.add(m); m.userData.celeb = lk.celeb || 'fist'; V.models.push(m); });
  };
  V.syncPlayers = function (ps, dt, extra) {
    ps.forEach((p, i) => { const m = V.models[i]; if (!m) return; m.visible = !p.hidden; m.position.set(p.x, 0, p.z); m.rotation.y = p.face;
      M.pose(m, dt, { spd: p.spd || 0, swingT: p.swingT, swingType: p.swingType, swingSide: p.swingSide, ready: true, celebT: p.celebT || 0, celeb: p.celeb || m.userData.celeb, t: V.t + i, serveHold: extra && extra.serveHold === i, high: p.high }); });
  };
  V.syncBall = function (b, dt) {
    const show = b.show !== false; V.ball.visible = show; V.ballShadow.visible = show;
    V.ball.position.set(b.x, b.y, b.z); V.ball.rotation.x += dt * 14; V.ball.rotation.z += dt * 6;
    V.ballShadow.position.set(b.x, 0.025, b.z); const k = U.clamp(1 - b.y / 6, 0.25, 1); V.ballShadow.scale.setScalar(0.8 + (1 - k) * 0.8); V.ballShadow.material.opacity = 0.42 * k;
    V.trailPts.unshift([b.x, b.y, b.z]); if (V.trailPts.length > V.trail.length * 2) V.trailPts.length = V.trail.length * 2;
    const fast = b.live && b.speed > 9;
    V.trail.forEach((m, i) => { const p = V.trailPts[i * 2 + 1]; m.visible = !!(show && fast && p); if (p) m.position.set(p[0], p[1], p[2]); });
  };
  V.land = function (p) { V.landRing.visible = !!p; if (p) { V.landRing.position.set(p.x, 0.03, p.z); const s = 1 + Math.sin(V.t * 10) * 0.08; V.landRing.scale.setScalar(s); } };
  V.aim = function (p, col) { V.aimRing.visible = !!p; if (p) { V.aimRing.position.set(p.x, 0.035, p.z); V.aimArrow.position.y = 0.55 + Math.sin(V.t * 8) * 0.1; if (col) V.aimRing.children.forEach((c) => c.material && c.material.color.set(col)); } };
  V.kitchen = function (side, k) { const kz = V.court && V.court.userData.kitchen; if (!kz) return; kz.forEach((m, i) => { const want = (side === 0 && i === 1) || (side === 1 && i === 0) ? k : 0; m.material.opacity = U.lerp(m.material.opacity, want * (0.25 + 0.15 * Math.sin(V.t * 14)), 0.3); }); };

  /* ---------- effects ---------- */
  V.shake = function (k) { V.shakeK = Math.max(V.shakeK, k); V.shakeT = 0.35; };
  V.burst = function (x, y, z, col, n, spd) { let c = 0; for (const p of V.parts) { if (p.life > 0) continue; p.life = 0.5 + Math.random() * 0.4; p.m.visible = true; p.m.material.color.set(col || '#fff'); p.m.position.set(x, y, z); const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2, s = (spd || 3) * (0.5 + Math.random()); p.v = [Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 1, Math.sin(a) * Math.cos(e) * s]; if (++c >= (n || 12)) break; } };
  V.confettiBurst = function (x, z) { const cols = ['#ff4fd8', '#3ff0ff', '#ffe14d', '#4ade80', '#ff7a3d', '#a78bfa']; V.confetti.forEach((p, i) => { p.life = 2.5 + Math.random() * 1.5; p.m.visible = true; p.m.material.color.set(cols[i % cols.length]); p.m.position.set(x + (Math.random() - 0.5) * 6, 4 + Math.random() * 3, z + (Math.random() - 0.5) * 6); p.v = [(Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2]; p.r = [Math.random() * 6, Math.random() * 6]; }); };
  V.cheer = function (k) { V.cheerT = Math.max(V.cheerT || 0, k || 1.2); };
  function updFx(dt) {
    V.parts.forEach((p) => { if (p.life <= 0) return; p.life -= dt; p.v[1] -= 9 * dt; p.m.position.x += p.v[0] * dt; p.m.position.y += p.v[1] * dt; p.m.position.z += p.v[2] * dt; p.m.scale.setScalar(Math.max(0.1, p.life * 1.6)); if (p.life <= 0 || p.m.position.y < 0) { p.life = 0; p.m.visible = false; } });
    V.confetti.forEach((p) => { if (p.life <= 0) return; p.life -= dt; p.v[1] = Math.max(-1.2, p.v[1] - 3 * dt); p.m.position.x += (p.v[0] + Math.sin(V.t * 3 + p.r[0]) * 0.6) * dt; p.m.position.y += p.v[1] * dt; p.m.position.z += p.v[2] * dt; p.m.rotation.x += p.r[0] * dt; p.m.rotation.y += p.r[1] * dt; if (p.life <= 0 || p.m.position.y < 0.02) { p.life = 0; p.m.visible = false; } });
    const c = V.court; if (!c) return; const ud = c.userData;
    if (V.cheerT > 0) V.cheerT -= dt;
    if (ud.crowd) ud.crowd.userData.groups.forEach((g, i) => { const ch = V.cheerT > 0 ? 1 : 0; g.position.y = ch ? Math.max(0, Math.sin(V.t * 10 + i * 2.1)) * 0.22 : Math.max(0, Math.sin(V.t * 1.5 + i * 2)) * 0.02; });
    if (ud.ocean && V.quality !== 'low') { const g = ud.ocean.geometry, p = g.attributes.position, base = ud.ocean.userData.base; for (let i = 0; i < p.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; p.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(x * 0.08 + V.t * 1.3) * 0.35 + Math.sin(z * 0.11 + V.t * 0.9) * 0.3; } p.needsUpdate = true; if ((V._on = (V._on || 0) + 1) % 10 === 0) g.computeVertexNormals(); }
    if (ud.beams) ud.beams.forEach((m) => { const ph = m.userData.ph + V.t * 0.6; m.rotation.x = 0.5 + Math.sin(ph) * 0.35; m.rotation.z = Math.cos(ph * 0.8) * 0.5; });
    if (ud.anim) ud.anim(V.t, dt);
    if (ud.clouds) ud.clouds.position.x = Math.sin(V.t * 0.02) * 30;
    if (ud.gulls) { ud.gulls.position.x = Math.sin(V.t * 0.1) * 40; ud.gulls.position.y = Math.sin(V.t * 0.7) * 1.5; }
  }

  /* ---------- camera ---------- */
  // side: 0 = behind the near team, 1 = behind the far team
  V.playCam = function (dt, focusX, side, ballZ, snap) { if (V.lockOff) { V.cam.clearViewOffset(); V.lockOff = false; }
    const asp = V.cam.aspect, portrait = asp < 1;
    const vfov = portrait ? 64 : 50; V.cam.fov = U.lerp(V.cam.fov, vfov, snap ? 1 : 0.1);
    const hf = 2 * Math.atan(Math.tan(vfov * Math.PI / 360) * asp), fitW = portrait ? 7.4 : 10.5;
    const d = U.clamp((fitW / 2) / Math.tan(hf / 2), 7.5, 20);
    const sgn = side === 1 ? -1 : 1;
    V.camX = U.lerp(V.camX, U.clamp(focusX, -2.4, 2.4) * 0.45, snap ? 1 : Math.min(1, dt * 3));
    const tz = D.HL + d * 0.82, ty = 2.5 + d * 0.42;
    const want = new T.Vector3(V.camX * sgn, ty, tz * sgn), look = new T.Vector3(V.camX * 0.5 * sgn, 0.2, (portrait ? -2.6 : -1.6) * sgn);
    if (snap) V.cam.position.copy(want); else V.cam.position.lerp(want, Math.min(1, dt * 4));
    V.lookAt = look; V.cam.lookAt(look); V.cam.updateProjectionMatrix();
  };
  V.orbitCam = function (dt, r, h, spd, target) { if (V.lockOff) { V.cam.clearViewOffset(); V.lockOff = false; } const a = V.t * (spd || 0.12); V.cam.fov = 55; V.cam.position.set(Math.sin(a) * r, h, Math.cos(a) * r); V.cam.lookAt(target || new T.Vector3(0, 0.5, 0)); V.cam.updateProjectionMatrix(); };
  V.lockerCam = function (m) { const p = m.position; const asp = V.cam.aspect; V.cam.fov = 40; V.cam.position.set(p.x + 0.0, 1.3, p.z + (asp < 1 ? 7.2 : 4.2)); V.cam.lookAt(p.x, 1.0, p.z); if (asp < 1) { const w = innerWidth, h = innerHeight; V.cam.setViewOffset(w, h, 0, h * 0.25, w, h); V.lockOff = true; } V.cam.updateProjectionMatrix(); };
  V.replayCam = function (dt, b, t, side) { if (V.lockOff) { V.cam.clearViewOffset(); V.lockOff = false; } const a = Math.sin(t * 0.3) * 0.55, s = side ? -1 : 1, portrait = innerHeight > innerWidth, r = portrait ? 15.5 : 13; const want = new T.Vector3(Math.sin(a) * r * s + b.x * 0.2, portrait ? 8.5 : 6.5, Math.cos(a) * r * s); V.cam.position.lerp(want, Math.min(1, dt * 2)); V.cam.fov = portrait ? 56 : 46; V.cam.lookAt(b.x * 0.3, 0.6, b.z * 0.35); V.cam.updateProjectionMatrix(); };
  V.project = function (x, y, z) { const v = new T.Vector3(x, y, z).project(V.cam); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, vis: v.z < 1 }; };
  V.unproject = function (sx, sy) { // screen -> ground point (y = 0)
    const v = new T.Vector3(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1, 0.5).unproject(V.cam); const dir = v.sub(V.cam.position).normalize(); const t = -V.cam.position.y / dir.y; if (t < 0) return null; return { x: V.cam.position.x + dir.x * t, z: V.cam.position.z + dir.z * t }; };
  V.render = function (dt) {
    V.t += dt; updFx(dt);
    if (V.shakeT > 0) { V.shakeT -= dt; const k = V.shakeK * (V.shakeT / 0.35); V.cam.position.x += (Math.random() - 0.5) * k; V.cam.position.y += (Math.random() - 0.5) * k; if (V.shakeT <= 0) V.shakeK = 0; }
    V.renderer.render(V.scene, V.cam);
  };
})();
