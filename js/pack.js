/* Grok Pickleball - PICKLE SMASH EXPANSION (DLC, unlocked in the Grok Arcade DLC Shop):
   3 new venues (Lava Island, Moon Base, Candy Stadium), 3 new paddles, and SMASH MODE with 6 Smashers and their super smashes.
   localStorage['grokDLC.pickle.pickle_smash_expansion'] (same origin as the arcade). Online: a host who owns it shares Smash Mode + the venues. */
(function () {
  'use strict';
  const PB = window.PB, D = PB.D, U = PB.U, T = THREE;
  const DLC = PB.DLC = { KEY: 'grokDLC.pickle.pickle_smash_expansion', NAME: 'Pickle Smash Expansion', PRICE: 75, SHOP: 'https://lizethbran13-cmyk.github.io/grok-arcade/', hostShare: false };
  DLC.mine = function () { try { return !!localStorage.getItem(DLC.KEY); } catch (e) { return false; } };
  DLC.on = function () { return DLC.mine() || DLC.hostShare; };

  /* ---------- data ---------- */
  D.COURTS.push(
    { id: 'volcano', n: 'Lava Island', icon: '\uD83C\uDF0B', desc: 'Black rock, glowing lava rivers and a smoking volcano.', court: '#c2410c', out: '#292524', line: '#fff7ed', kitchen: '#9a3412', sky: ['#1c0a05', '#7c2d12'], night: true, price: 0, dlc: 1 },
    { id: 'space', n: 'Moon Base', icon: '\uD83D\uDE80', desc: 'Low-gravity vibes on the Moon, with Earth in the sky.', court: '#1d4ed8', out: '#9ca3af', line: '#e0f2fe', kitchen: '#1e40af', sky: ['#000000', '#0b1030'], night: true, neon: true, price: 0, dlc: 1 },
    { id: 'candy', n: 'Candy Stadium', icon: '\uD83C\uDF6D', desc: 'Lollipop trees, gumdrops and a chocolate river.', court: '#ec4899', out: '#fbcfe8', line: '#ffffff', kitchen: '#db2777', sky: ['#7dd3fc', '#fce7f3'], night: false, price: 0, dlc: 1 }
  );
  D.PADDLES.push(
    { id: 'rocket', n: 'Rocket Blaster', a: '#ef4444', b: '#f8fafc', price: 0, glow: '#ff7a1a', dlc: 1 },
    { id: 'thunder', n: 'Thunder Strike', a: '#facc15', b: '#1e3a8a', price: 0, glow: '#fde047', dlc: 1 },
    { id: 'frost', n: 'Frost Bite', a: '#a5f3fc', b: '#1e40af', price: 0, glow: '#67e8f9', dlc: 1 }
  );
  // the 6 Smashers. look follows G.aiLook(ladder) fields; super = their super smash
  D.SMASHERS = [
    { id: 'rita', n: 'Rocket Rita', icon: '\uD83D\uDE80', sup: 'rocket', sn: 'ROCKET BALL', col: '#ef4444', desc: 'Fires a rocket that EXPLODES when it lands. Nobody can return it!', look: { shirt: '#ef4444', shorts: '#111827', hair: '#111827', hat: 'headband', hatCol: '#ffffff', skin: 1, pony: true }, paddle: 'rocket' },
    { id: 'fran', n: 'Frosty Fran', icon: '\u2744\uFE0F', sup: 'freeze', sn: 'FREEZE SMASH', col: '#38bdf8', desc: 'Freezes the other player in an ice block for 2 seconds.', look: { shirt: '#67e8f9', shorts: '#1e40af', hair: '#e5e7eb', hat: 'bucket', hatCol: '#e0f2fe', skin: 0, long: true }, paddle: 'frost' },
    { id: 'bo', n: 'Bolt Bo', icon: '\u26A1', sup: 'zap', sn: 'THUNDER SMASH', col: '#facc15', desc: 'A lightning ball that speeds up over the net and zaps them so they can\u2019t move.', look: { shirt: '#facc15', shorts: '#1e3a8a', hair: '#1f2937', hat: 'cap', hatCol: '#1e3a8a', skin: 3 }, paddle: 'thunder' },
    { id: 'bertha', n: 'Big Bertha', icon: '\uD83C\uDFD0', sup: 'giant', sn: 'GIANT BALL', col: '#f97316', desc: 'The ball turns GIANT and bounces way over their head.', look: { shirt: '#f97316', shorts: '#7c2d12', hair: '#7c2d12', hat: 'visor', hatCol: '#fde047', skin: 2, bun: true }, paddle: 'lava' },
    { id: 'dan', n: 'Dill Dan', icon: '\uD83E\uDD52', sup: 'split', sn: 'PICKLE SPLIT', col: '#65a30d', desc: 'The ball splits into 3 pickles. Which one is real?!', look: { shirt: '#65a30d', shorts: '#365314', hair: '#5b3a1e', hat: 'pickle', hatCol: '#65a30d', skin: 0, glasses: true }, paddle: 'pickle' },
    { id: 'kiki', n: 'Curvy Kiki', icon: '\uD83C\uDF4C', sup: 'banana', sn: 'BANANA CURVE', col: '#ff4fd8', desc: 'A banana shot that curves around them into the corner.', look: { shirt: '#ff4fd8', shorts: '#ffffff', hair: '#f6c344', hat: null, hatCol: '#ffffff', skin: 4, pony: true }, paddle: 'sunset' }
  ];
  D.smasher = (id) => D.SMASHERS.find((s) => s.id === id) || D.SMASHERS[0];
  D.smasherLook = function (id) { const s = D.smasher(id), l = s.look; return Object.assign({ shorts: '#1f2937', glasses: false, pony: false, bun: false, long: false, celeb: 'jump' }, l, { paddle: D.PADDLES.find((p) => p.id === s.paddle) || D.PADDLES[0] }); };

  /* ---------- venues ---------- */
  const C = PB.Courts, H = C.H, M = PB.M, B = M.B;
  const fin = (root, b, g2) => { const g = new T.Group(); H.att(g, b, true); H.att(g, g2, false); H.rcv(g); root.add(g); return g; };
  const glowMat = (col, op) => new T.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op == null ? 1 : op, depthWrite: op == null, fog: false });

  C.BUILD.volcano = function (root, c, rnd) {
    H.skyDome(root, '#160604', '#a8401a');
    H.ground(root, 420, ['#1c1917', '#3a2a24'], rnd, 70, (x, z) => { const d = Math.hypot(x, z); return d > 26 ? (d - 26) * 0.12 + U.fbm(x * 0.04, z * 0.04) * 3 : 0; });
    const b = new B(), g2 = new B();
    // basalt pads around the court, volcanic rocks
    for (let i = 0; i < 60; i++) { const a = rnd() * Math.PI * 2, d = 9 + rnd() * 22, x = Math.cos(a) * d * 1.1, z = Math.sin(a) * d; if (Math.abs(x) < 7 && Math.abs(z) < 11) continue; b.sph(0.5 + rnd() * 1.4, ['#292524', '#1c1917', '#44403c'][i % 3], x, 0.2, z, 1, 0.55 + rnd() * 0.4, 1, rnd(), rnd(), 0, null, 7, 5); }
    // tiki torches with real flames (glow)
    const torch = (x, z) => { b.cyl(0.07, 0.09, 2.2, '#78350f', x, 1.1, z, 0, 0, 0, null, 8); b.cyl(0.2, 0.14, 0.35, '#a16207', x, 2.3, z, 0, 0, 0, null, 10); g2.cone(0.17, 0.5, '#ffb020', x, 2.7, z, 0, 0, 0, 'glow', 8); g2.cone(0.1, 0.36, '#fff3c4', x, 2.66, z, 0, 0, 0, 'glow', 8); };
    [[-5.4, -9], [5.4, -9], [-5.4, 0], [5.4, 0], [-5.4, 9], [5.4, 9]].forEach(([x, z]) => torch(x, z));
    // bamboo + stone bleachers with fans
    const seats = []; H.bleacher(b, -(D.HW + 4.6), 0, Math.PI / 2, 4, 12, '#57534e', seats); H.bleacher(b, D.HW + 9.2, 0, -Math.PI / 2, 4, 12, '#57534e', seats);
    // giant tiki heads
    [[-11, -15, 0.4], [11, -15, -0.4]].forEach(([x, z, r]) => { b.box(2.2, 4.6, 1.8, 0.3, '#57534e', x, 2.3, z, 0, r, 0); b.box(2.4, 0.5, 2.0, 0.1, '#44403c', x, 3.9, z, 0, r, 0); g2.sph(0.28, '#ff7a1a', x - 0.45, 3.2, z + 0.9, 1, 1, 0.4, 0, r, 0, 'glow'); g2.sph(0.28, '#ff7a1a', x + 0.45, 3.2, z + 0.9, 1, 1, 0.4, 0, r, 0, 'glow'); b.box(1.2, 0.4, 0.3, 0.1, '#1c1917', x, 1.8, z + 0.85, 0, r, 0); });
    // palm trees (dark)
    for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1, x = s * (13 + rnd() * 8), z = -16 + i * 3.6; H.tree(b, x, z, 0.9, rnd, ['#14532d', '#166534', '#15803d']); }
    fin(root, b, g2);
    // the volcano + lava rivers (animated glow)
    const vb = new B(); vb.cone(60, 55, '#292524', 0, 22, -150, 0, 0, 0, null, 28); vb.cone(14, 8, '#1c1917', 0, 50, -150, 0, 0, 0, null, 20);
    const vg = new T.Group(); H.att(vg, vb, false); root.add(vg);
    const lavaM = new T.MeshBasicMaterial({ color: '#ff5a1a' }), lava = [];
    const crater = new T.Mesh(new T.CylinderGeometry(9, 9, 0.5, 24), lavaM); crater.position.set(0, 53, -150); root.add(crater);
    for (let k = 0; k < 3; k++) { const pts = []; const x0 = (k - 1) * 4; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector3(x0 + Math.sin(t * 5 + k) * (3 + t * 8), 50 - t * 49.5, -144 + t * 52)); } const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 1.2 + k * 0.2, 6, false), lavaM); root.add(tube); }
    // lava moats on both sides of the court (flat glowing strips with dark crust islands)
    [-1, 1].forEach((s) => { const m = new T.Mesh(new T.PlaneGeometry(2.4, 34, 1, 1), lavaM); m.rotation.x = -Math.PI / 2; m.position.set(s * (D.HW + 2.6), -0.01, 0); root.add(m); lava.push(m); for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.CircleGeometry(0.3 + Math.random() * 0.4, 7), new T.MeshStandardMaterial({ color: '#292524', roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(s * (D.HW + 2.6) + (Math.random() - 0.5) * 1.4, 0.0, -15 + i * 6 + Math.random() * 2); root.add(r); lava.push(r); } });
    // smoke + embers
    const smoke = []; for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(6 + i, 10, 8), new T.MeshBasicMaterial({ color: '#57534e', transparent: true, opacity: 0.35, depthWrite: false, fog: false })); m.position.set(0, 58 + i * 8, -150); root.add(m); smoke.push(m); }
    const ep = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) { ep[i * 3] = (Math.random() - 0.5) * 40; ep[i * 3 + 1] = Math.random() * 14; ep[i * 3 + 2] = (Math.random() - 0.5) * 40; }
    const eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(ep, 3)); const embers = new T.Points(eg, new T.PointsMaterial({ color: '#ffb020', size: 0.12, transparent: true, opacity: 0.9 })); root.add(embers);
    root.userData.crowd = H.crowdOn(root, seats, 61, 0.55);
    root.userData.anim = (t, dt) => { const k = 0.75 + Math.sin(t * 2.2) * 0.25; lavaM.color.setRGB(1, 0.32 + k * 0.12, 0.08 * k); smoke.forEach((m, i) => { m.position.y = 58 + ((i * 8 + t * 3) % 72); m.material.opacity = 0.4 * (1 - ((i * 8 + t * 3) % 72) / 72); m.position.x = Math.sin(t * 0.2 + i) * 6; });
      const a = eg.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * (0.6 + (i % 5) * 0.2); if (y > 14) y = 0; a.setY(i, y); } a.needsUpdate = true; };
    return { sun: { col: '#ffb07a', pos: [-10, 24, -16], k: 0.85 }, hemi: ['#ff9a5a', '#2a120a', 0.7], fog: ['#3a1408', 60, 340], bg: '#2a0e06', night: true, spots: [[-7, 8, -8], [7, 8, 8]] };
  };

  C.BUILD.space = function (root, c, rnd) {
    const sky = new T.Mesh(new T.SphereGeometry(600, 16, 10), new T.MeshBasicMaterial({ color: '#02030a', side: T.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -1; root.add(sky);
    // moon dust with craters
    const craters = []; for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = 14 + rnd() * 90; craters.push([Math.cos(a) * d, Math.sin(a) * d, 2 + rnd() * 6]); }
    H.ground(root, 420, ['#6b7280', '#a1a1aa'], rnd, 90, (x, z) => { let h = Math.hypot(x, z) > 18 ? U.fbm(x * 0.03, z * 0.03) * 2.5 : 0; craters.forEach(([cx, cz, r]) => { const d = Math.hypot(x - cx, z - cz); if (d < r * 1.3) h += d < r ? -Math.cos(d / r * Math.PI / 2) * r * 0.25 : Math.sin((d - r) / (r * 0.3) * Math.PI) * r * 0.08; }); return h; });
    const b = new B(), g2 = new B();
    // habitat domes, rocket on its pad, antenna dish, rover, flag
    [[-13, -12, 3.2], [-19, -4, 2.2], [14, -13, 2.6]].forEach(([x, z, r]) => { b.cyl(r + 0.2, r + 0.3, 0.4, '#e5e7eb', x, 0.2, z, 0, 0, 0, 'gloss', 24); b.box(1.2, 1.4, 1.2, 0.1, '#cbd5e1', x + r * 0.8, 0.7, z + r * 0.6); g2.sph(0.15, '#22d3ee', x + r * 0.8, 1.5, z + r * 0.6, 1, 1, 1, 0, 0, 0, 'glow'); });
    const rx = 13, rz = 10; b.cyl(2.4, 2.6, 0.4, '#475569', rx, 0.2, rz, 0, 0, 0, null, 20); b.cyl(0.9, 1.0, 7, '#f8fafc', rx, 4, rz, 0, 0, 0, 'gloss', 18); b.cone(0.9, 2.2, '#ef4444', rx, 8.6, rz, 0, 0, 0, 'gloss', 18); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.box(0.1, 1.8, 1.3, 0.05, '#ef4444', rx + Math.cos(a) * 1.1, 1.3, rz + Math.sin(a) * 1.1, 0, -a, 0); } g2.sph(0.32, '#7dd3fc', rx, 5.4, rz + 0.86, 1, 1, 0.4, 0, 0, 0, 'glow'); b.box(0.5, 9, 0.5, 0.05, '#64748b', rx - 2.6, 4.5, rz); b.box(2.2, 0.3, 0.3, 0.05, '#64748b', rx - 1.6, 7, rz);
    b.cyl(0.12, 0.15, 3, '#94a3b8', -14, 1.5, 10); b.geo(new T.SphereGeometry(1.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), '#e2e8f0', -14, 3.4, 10, -0.9, 0.6, 0, 1, 1, 1, 'gloss'); g2.sph(0.15, '#ef4444', -14, 4.8, 10.6, 1, 1, 1, 0, 0, 0, 'glow');
    b.box(2.2, 0.5, 1.4, 0.15, '#f1f5f9', 9, 0.7, -9); [[-0.8, -0.7], [0.8, -0.7], [-0.8, 0.7], [0.8, 0.7]].forEach(([a, c2]) => b.cyl(0.32, 0.32, 0.25, '#1f2937', 9 + a, 0.32, -9 + c2, Math.PI / 2, 0, 0, null, 12)); b.box(0.9, 0.5, 0.7, 0.1, '#fbbf24', 9.4, 1.2, -9);
    b.cyl(0.03, 0.03, 2.6, '#e5e7eb', -6, 1.3, 13); b.box(1.1, 0.7, 0.03, 0.01, '#16a34a', -5.4, 2.2, 13); g2.sph(0.18, '#e6ff3b', -5.4, 2.2, 13.03, 1, 1, 0.2, 0, 0, 0, 'glow');
    // glowing court rail + light pylons
    [-1, 1].forEach((s) => { g2.box(D.HW * 2 + 4.4, 0.06, 0.08, 0.02, '#22d3ee', 0, 0.03, s * (D.HL + 3), 0, 0, 0, 'glow'); g2.box(0.08, 0.06, D.HL * 2 + 6, 0.02, '#22d3ee', s * (D.HW + 2.2), 0.03, 0, 0, 0, 0, 'glow'); });
    [[-6, -10], [6, -10], [-6, 10], [6, 10]].forEach(([x, z]) => { b.cyl(0.12, 0.16, 6, '#334155', x, 3, z, 0, 0, 0, 'gloss'); g2.box(0.9, 0.3, 0.3, 0.05, '#e0f2fe', x, 6, z, 0, Math.atan2(-x, -z), 0, 'glow'); });
    // astronaut fans in low-gravity bleachers
    const seats = []; H.bleacher(b, -(D.HW + 4.6), 0, Math.PI / 2, 3, 12, '#64748b', seats); H.bleacher(b, D.HW + 7.6, 0, -Math.PI / 2, 3, 12, '#64748b', seats);
    fin(root, b, g2);
    root.userData.crowd = H.crowdOn(root, seats, 71, 0.5);
    // Earth, Saturn-ish planet, stars
    const earth = new T.Group(); earth.position.set(-90, 120, -300); root.add(earth);
    const ecv = document.createElement('canvas'); ecv.width = 256; ecv.height = 128; const ex = ecv.getContext('2d'); ex.fillStyle = '#1d4ed8'; ex.fillRect(0, 0, 256, 128); const er = U.rng(5); ex.fillStyle = '#16a34a'; for (let i = 0; i < 22; i++) { ex.beginPath(); ex.ellipse(er() * 256, 20 + er() * 88, 10 + er() * 26, 6 + er() * 16, er() * 3, 0, 7); ex.fill(); } ex.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 26; i++) { ex.beginPath(); ex.ellipse(er() * 256, er() * 128, 8 + er() * 22, 2 + er() * 4, 0, 0, 7); ex.fill(); }
    const eMesh = new T.Mesh(new T.SphereGeometry(30, 32, 20), new T.MeshBasicMaterial({ map: new T.CanvasTexture(ecv), fog: false })); earth.add(eMesh);
    const atm = new T.Mesh(new T.SphereGeometry(32.5, 32, 20), new T.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.25, fog: false, side: T.BackSide })); earth.add(atm);
    const pl = new T.Group(); pl.position.set(160, 70, -260); root.add(pl); pl.add(new T.Mesh(new T.SphereGeometry(14, 24, 16), new T.MeshBasicMaterial({ color: '#f59e0b', fog: false }))); const ring = new T.Mesh(new T.RingGeometry(18, 27, 40), new T.MeshBasicMaterial({ color: '#fde68a', side: T.DoubleSide, transparent: true, opacity: 0.7, fog: false })); ring.rotation.x = 1.2; pl.add(ring);
    const sp = []; for (let i = 0; i < 1200; i++) { const a = rnd() * Math.PI * 2, e = -0.05 + rnd() * 1.5, r = 520; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); root.add(new T.Points(sg, new T.PointsMaterial({ color: '#ffffff', size: 1.7, sizeAttenuation: false, fog: false })));
    // a satellite drifting by
    const sat = new T.Group(); const sb = new B(); sb.box(1.2, 1.2, 1.6, 0.1, '#e5e7eb', 0, 0, 0, 0, 0, 0, 'gloss'); sb.box(4, 0.05, 1.4, 0.01, '#1e3a8a', -2.6, 0, 0); sb.box(4, 0.05, 1.4, 0.01, '#1e3a8a', 2.6, 0, 0); H.att(sat, sb, false); sat.position.set(0, 40, -80); root.add(sat);
    root.userData.anim = (t) => { eMesh.rotation.y = t * 0.05; sat.position.x = Math.sin(t * 0.06) * 90; sat.rotation.z = t * 0.2; sat.rotation.y = t * 0.1; pl.rotation.y = t * 0.03; };
    return { sun: { col: '#ffffff', pos: [14, 26, 10], k: 1.1 }, hemi: ['#c7d2fe', '#1f2937', 0.55], fog: ['#02030a', 120, 520], bg: '#02030a', night: true, spots: [[-6, 7, -10], [6, 7, 10]] };
  };

  C.BUILD.candy = function (root, c, rnd) {
    H.skyDome(root, '#60c8ff', '#ffe4f3');
    H.ground(root, 420, ['#86efac', '#bbf7d0'], rnd, 70, (x, z) => { const d = Math.hypot(x, z); return d > 40 ? (d - 40) * 0.1 + U.fbm(x * 0.02, z * 0.02) * 5 : 0; });
    const b = new B(), g2 = new B();
    const swirl = ['#ff4fd8', '#ffffff', '#3ff0ff', '#ffe14d', '#a78bfa', '#4ade80'];
    // lollipop trees (stick + swirl disc built from rings)
    const lolli = (x, z, s, c1, c2) => { b.cyl(0.08 * s, 0.1 * s, 3.4 * s, '#fafafa', x, 1.7 * s, z, 0, 0, 0, 'gloss', 8); for (let k = 0; k < 5; k++) b.tor(0.18 * s + k * 0.18 * s, 0.1 * s, k % 2 ? c1 : c2, x, 3.9 * s, z, 0, Math.atan2(x, z), 0, 'gloss'); b.cyl(0.18 * s, 0.18 * s, 0.2 * s, c1, x, 3.9 * s, z, Math.PI / 2, Math.atan2(x, z), 0, 'gloss', 12); };
    for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, d = 15 + rnd() * 22, x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d; if (Math.abs(x) < 12 && Math.abs(z) < 12) continue; lolli(x, z, 0.9 + rnd() * 0.7, swirl[i % 6], '#ffffff'); }
    // gumdrops along the fence line, candy canes at the corners
    for (let i = 0; i < 22; i++) { const s = i % 2 ? 1 : -1; b.sph(0.45, swirl[(i >> 1) % 6], s * (D.HW + 3.4), 0.18, -10.5 + (i >> 1) * 2, 1, 0.9, 1, 0, 0, 0, 'gloss', 12, 8); }
    const cane = (x, z, ry) => { for (let k = 0; k < 10; k++) b.cyl(0.14, 0.14, 0.32, k % 2 ? '#ef4444' : '#ffffff', x, 0.16 + k * 0.32, z, 0, 0, 0, 'gloss', 10); b.tor(0.4, 0.14, '#ef4444', x + Math.sin(ry) * 0.4, 3.2, z + Math.cos(ry) * 0.4, 0, ry + Math.PI / 2, 0, 'gloss', Math.PI); };
    [[-D.HW - 3, -D.HL - 3, 0], [D.HW + 3, -D.HL - 3, Math.PI], [-D.HW - 3, D.HL + 3, 0], [D.HW + 3, D.HL + 3, Math.PI]].forEach(([x, z, r]) => cane(x, z, r));
    // cupcake bleachers: frosting-topped stands with sprinkles
    const seats = []; H.bleacher(b, -(D.HW + 5.0), 0, Math.PI / 2, 4, 12, '#f9a8d4', seats); H.bleacher(b, D.HW + 9.6, 0, -Math.PI / 2, 4, 12, '#c4b5fd', seats);
    // giant cupcakes + donut arch + ice cream cones
    const cupcake = (x, z, s, fr) => { b.cyl(1.4 * s, 1.0 * s, 1.4 * s, '#f59e0b', x, 0.7 * s, z, 0, 0, 0, null, 16); b.sph(1.5 * s, fr, x, 1.6 * s, z, 1, 0.6, 1, 0, 0, 0, 'gloss', 16, 10); b.sph(0.6 * s, fr, x, 2.3 * s, z, 1, 0.8, 1, 0, 0, 0, 'gloss'); b.sph(0.3 * s, '#ef4444', x, 2.85 * s, z, 1, 1, 1, 0, 0, 0, 'gloss'); for (let k = 0; k < 14; k++) { const a = rnd() * Math.PI * 2, r = rnd() * 1.2 * s; g2.box(0.22 * s, 0.06 * s, 0.06 * s, 0.01, swirl[k % 6], x + Math.cos(a) * r, 1.95 * s + Math.random() * 0.2, z + Math.sin(a) * r, 0, a, 0.3); } };
    cupcake(-14, -14, 1.6, '#fbcfe8'); cupcake(15, -12, 1.3, '#bae6fd'); cupcake(-16, 12, 1.2, '#fde68a');
    b.tor(5.5, 1.3, '#f9a8d4', 0, 6.2, -D.HL - 9, 0, 0, 0, 'gloss'); b.tor(5.5, 0.9, '#d97706', 0, 6.2, -D.HL - 9.25, 0, 0, 0, null); for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; g2.box(0.4, 0.08, 0.08, 0.01, swirl[k % 6], Math.cos(a) * 5.5, 6.2 + Math.sin(a) * 5.5, -D.HL - 7.8, 0, 0, a + 0.6); }
    [[13, 13], [17, 4]].forEach(([x, z]) => { b.cone(0.9, 2.6, '#d97706', x, 1.3, z, Math.PI, 0, 0, null, 14); b.sph(0.95, '#fbcfe8', x, 2.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.85, '#a7f3d0', x, 3.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.25, '#ef4444', x, 4.8, z); });
    fin(root, b, g2);
    // chocolate river (animated ripples) behind the far baseline, with a wafer bridge
    const rg = new T.PlaneGeometry(140, 9, 70, 6); rg.rotateX(-Math.PI / 2); rg.translate(0, -0.15, -D.HL - 15);
    const river = new T.Mesh(rg, new T.MeshStandardMaterial({ color: '#6b3a1e', roughness: 0.25, metalness: 0.1 })); root.add(river); river.userData.base = rg.attributes.position.array.slice();
    const wb = new B(); for (let k = 0; k < 7; k++) wb.box(1.3, 0.25, 10.5, 0.05, k % 2 ? '#fbbf24' : '#f59e0b', -4 + k * 1.33, 0.25, -D.HL - 15); const wg = new T.Group(); H.att(wg, wb, true); root.add(wg);
    // cotton candy clouds
    const cl = H.clouds(root, rnd, 8, 220, 60); cl.children.forEach((m, i) => { m.material = new T.MeshBasicMaterial({ color: i % 2 ? '#fbcfe8' : '#e9d5ff', fog: false }); });
    // floating spinning lollipops
    const spin = []; for (let i = 0; i < 4; i++) { const g = new T.Group(); const sb = new B(); sb.cyl(0.12, 0.12, 0.25, swirl[i], 0, 0, 0, Math.PI / 2, 0, 0, 'gloss', 16); for (let k = 0; k < 4; k++) sb.tor(0.2 + k * 0.2, 0.1, k % 2 ? swirl[i] : '#ffffff', 0, 0, 0, 0, 0, 0, 'gloss'); sb.cyl(0.05, 0.05, 1.6, '#ffffff', 0, -1, 0, 0, 0, 0, 'gloss', 6); H.att(g, sb, false); g.position.set((i % 2 ? 1 : -1) * (9 + i), 7 + i, -6 + i * 4); root.add(g); spin.push(g); }
    root.userData.crowd = H.crowdOn(root, seats, 81, 0.6); root.userData.clouds = cl;
    root.userData.anim = (t) => { spin.forEach((g, i) => { g.rotation.y = t * (0.8 + i * 0.2); g.position.y = 7 + i + Math.sin(t + i) * 0.6; });
      if (PB.V.quality !== 'low') { const p = rg.attributes.position, base = river.userData.base; for (let i = 0; i < p.count; i++) p.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(base[i * 3] * 0.3 + t * 2) * 0.08; p.needsUpdate = true; } };
    return { sun: { col: '#fff6f0', pos: [16, 28, 12], k: 1.0 }, hemi: ['#ffe4f3', '#86efac', 0.7], fog: ['#fde7f3', 90, 380], bg: '#bfe9ff' };
  };
})();
