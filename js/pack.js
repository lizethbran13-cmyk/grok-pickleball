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
    { id: 'space', n: 'Moon Base', icon: '\uD83D\uDE80', desc: 'Low-gravity vibes on the Moon, with Earth in the sky.', court: '#1d4ed8', out: '#334155', line: '#e0f2fe', kitchen: '#1e40af', sky: ['#000000', '#0b1030'], night: true, neon: true, price: 0, dlc: 1 },
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
    { id: 'kiki', n: 'Curvy Kiki', icon: '\uD83C\uDF4C', sup: 'banana', sn: 'BANANA CURVE', col: '#ff4fd8', desc: 'A banana shot that curves into the corner and makes them slip on the peel!', look: { shirt: '#ff4fd8', shorts: '#ffffff', hair: '#f6c344', hat: null, hatCol: '#ffffff', skin: 4, pony: true }, paddle: 'sunset' }
  ];
  D.smasher = (id) => D.SMASHERS.find((s) => s.id === id) || D.SMASHERS[0];
  D.smasherLook = function (id) { const s = D.smasher(id), l = s.look; return Object.assign({ shorts: '#1f2937', glasses: false, pony: false, bun: false, long: false, celeb: 'jump' }, l, { paddle: D.PADDLES.find((p) => p.id === s.paddle) || D.PADDLES[0] }); };

  /* ---------- venues ---------- */
  const C = PB.Courts, H = C.H, M = PB.M, B = M.B;
  // a stand behind the far baseline (seats go to the crowd) + a big branded screen over it
  const BACKZ = -(D.HL + 5.2);
  const backStand = (b, g2, seats, col, g1, g3) => { H.bleacher(b, 0, BACKZ, 0, 4, 15, col, seats); g2.box(15.2, 0.08, 0.08, 0.02, g1, 0, 0.32, BACKZ + 0.25, 0, 0, 0, 'glow'); g2.box(15.2, 0.08, 0.08, 0.02, g3 || g1, 0, 0.32 + 4 * 0.42, BACKZ - 3 * 0.62 - 0.2, 0, 0, 0, 'glow'); };
  const bigScreen = (root, b, g2, frame, title, sub, cols, rnd) => {
    const z = BACKZ - 3.4; b.box(0.25, 5.2, 0.25, 0.05, frame, -5, 2.6, z); b.box(0.25, 5.2, 0.25, 0.05, frame, 5, 2.6, z); b.box(10.6, 2.6, 0.3, 0.1, frame, 0, 6.2, z, 0, 0, 0, 'gloss');
    g2.box(10.2, 0.1, 0.06, 0.02, cols[2], 0, 7.5, z + 0.2, 0, 0, 0, 'glow'); g2.box(10.2, 0.1, 0.06, 0.02, cols[2], 0, 4.9, z + 0.2, 0, 0, 0, 'glow');
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); const gr = x.createLinearGradient(0, 0, 512, 128); gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]); x.fillStyle = gr; x.fillRect(0, 0, 512, 128);
    x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 50; i++) x.fillRect(rnd() * 512, rnd() * 128, 2, 2);
    x.font = '900 54px Fredoka, Arial Black, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = cols[3]; x.strokeText(title, 256, 58); x.fillStyle = cols[4]; x.fillText(title, 256, 58);
    x.font = '700 22px Fredoka, Arial, sans-serif'; x.fillStyle = cols[5]; x.fillText(sub, 256, 106);
    const scr = new T.Mesh(new T.PlaneGeometry(10, 2.1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), fog: false })); scr.position.set(0, 6.2, z + 0.16); root.add(scr); };
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
    /* ---- dense dressing in front of the camera ---- */
    backStand(b, g2, seats, '#57534e', '#ff7a1a', '#ffb020');
    bigScreen(root, b, g2, '#292524', 'LAVA ISLAND \uD83C\uDF0B', 'PICKLE SMASH \u00B7 HOT COURT CHAMPIONSHIP', ['#450a0a', '#9a3412', '#ff7a1a', '#7c2d12', '#ffe14d', '#fed7aa'], rnd);
    const obs = (x, z, r, h) => { b.cone(r, h, rnd() < 0.5 ? '#1c1917' : '#292524', x, h / 2, z, (rnd() - 0.5) * 0.25, rnd() * 3, (rnd() - 0.5) * 0.25, 'gloss', 6); };
    for (let i = 0; i < 70; i++) { const x = (rnd() - 0.5) * 70, z = -13 - rnd() * 55; if (Math.abs(x) < 9 && z > -18) continue; if (rnd() < 0.5) obs(x, z, 0.3 + rnd() * 0.8, 1 + rnd() * 3.5); else b.geo(new T.DodecahedronGeometry(0.4 + rnd() * 1.1, 0), ['#292524', '#1c1917', '#44403c'][(rnd() * 3) | 0], x, 0.3, z, rnd() * 3, rnd() * 3, 0, 1, 0.7, 1); }
    // thatched tiki huts with glowing doorways
    const hut = (x, z, s, r) => { b.cyl(1.4 * s, 1.5 * s, 1.8 * s, '#a16207', x, 0.9 * s, z, 0, r, 0, null, 10); b.cone(2.3 * s, 1.9 * s, '#ca8a04', x, 2.6 * s, z, 0, r, 0, null, 10); b.cone(2.0 * s, 0.3 * s, '#854d0e', x, 1.75 * s, z, 0, r, 0, null, 10); g2.box(0.7 * s, 1.1 * s, 0.05, 0.02, '#ffb020', x + Math.sin(r) * 1.42 * s, 0.6 * s, z + Math.cos(r) * 1.42 * s, 0, r, 0, 'glow'); };
    hut(-12, -18, 1.1, 0.5); hut(12.5, -17, 1, -0.5); hut(-18, -28, 1.3, 0.4); hut(17, -30, 1.2, -0.3); hut(-6, -34, 1, 0.1);
    // more torches + palms right in view
    [[-8, -13], [8, -13], [-3.5, -20], [3.5, -20], [-10, -24], [10, -24]].forEach(([x, z]) => torch(x, z));
    [[-7, -24], [7, -26], [-15, -22], [15, -21], [-3, -42], [11, -40], [-13, -38]].forEach(([x, z]) => H.tree(b, x, z, 1.1, rnd, ['#14532d', '#166534', '#15803d']));
    // lava geysers (glowing columns + splash) and a basalt arch
    [[-8, -30, 4.5], [9, -35, 6], [0, -48, 8]].forEach(([x, z, h]) => { b.cone(1.6, 1.2, '#1c1917', x, 0.6, z, 0, 0, 0, null, 10); g2.cyl(0.25, 0.5, h, '#ff7a1a', x, h / 2 + 0.6, z, 0, 0, 0, 'glow', 10); g2.sph(0.9, '#ffb020', x, h + 0.8, z, 1, 0.7, 1, 0, 0, 0, 'glow'); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g2.sph(0.22, '#ffe14d', x + Math.cos(a) * 1.1, h + 0.2 - k * 0.3, z + Math.sin(a) * 1.1, 1, 1, 1, 0, 0, 0, 'glow'); } });
    b.geo(new T.TorusGeometry(6, 1.1, 8, 20, Math.PI), '#292524', 0, 0, -27, 0, 0, 0, 1, 1, 1, null); g2.geo(new T.TorusGeometry(6, 0.12, 6, 30, Math.PI), '#ff5a1a', 0, 0, -26.1, 0, 0, 0, 1, 1, 1, 'glow');
    fin(root, b, g2);
    // the volcano + lava rivers (animated glow)
    const vb = new B(); vb.cone(60, 55, '#292524', 0, 22, -150, 0, 0, 0, null, 28); vb.cone(14, 8, '#1c1917', 0, 50, -150, 0, 0, 0, null, 20);
    const vg = new T.Group(); H.att(vg, vb, false); root.add(vg);
    const lavaM = new T.MeshBasicMaterial({ color: '#ff5a1a' }), lava = [];
    const crater = new T.Mesh(new T.CylinderGeometry(9, 9, 0.5, 24), lavaM); crater.position.set(0, 53, -150); root.add(crater);
    for (let k = 0; k < 3; k++) { const pts = []; const x0 = (k - 1) * 4; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector3(x0 + Math.sin(t * 5 + k) * (3 + t * 8), 50 - t * 49.5, -144 + t * 52)); } const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 1.2 + k * 0.2, 6, false), lavaM); root.add(tube); }
    // lava moats on both sides of the court (flat glowing strips with dark crust islands)
    [-1, 1].forEach((s) => { const m = new T.Mesh(new T.PlaneGeometry(2.4, 34, 1, 1), lavaM); m.rotation.x = -Math.PI / 2; m.position.set(s * (D.HW + 2.6), -0.01, 0); root.add(m); lava.push(m); for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.CircleGeometry(0.3 + Math.random() * 0.4, 7), new T.MeshStandardMaterial({ color: '#292524', roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(s * (D.HW + 2.6) + (Math.random() - 0.5) * 1.4, 0.0, -15 + i * 6 + Math.random() * 2); root.add(r); lava.push(r); } });
    // a lava river crossing behind the stand, with a basalt bridge
    { const m = new T.Mesh(new T.PlaneGeometry(160, 4.2, 1, 1), lavaM); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.02, -21.5); root.add(m); lava.push(m); const bb = new B(); for (let k = 0; k < 6; k++) bb.box(1.0, 0.35, 5.6, 0.08, k % 2 ? '#292524' : '#44403c', -2.8 + k * 1.1, 0.25, -21.5); const bg = new T.Group(); H.att(bg, bb, true); root.add(bg); }
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
    H.ground(root, 420, ['#3f4350', '#575b66'], rnd, 90, (x, z) => { let h = Math.hypot(x, z) > 18 ? U.fbm(x * 0.03, z * 0.03) * 2.5 : 0; craters.forEach(([cx, cz, r]) => { const d = Math.hypot(x - cx, z - cz); if (d < r * 1.3) h += d < r ? -Math.cos(d / r * Math.PI / 2) * r * 0.25 : Math.sin((d - r) / (r * 0.3) * Math.PI) * r * 0.08; }); return h; });
    const b = new B(), g2 = new B();
    // habitat domes, rocket on its pad, antenna dish, rover, flag
    [[-13, -12, 3.2], [-19, -4, 2.2], [14, -13, 2.6]].forEach(([x, z, r]) => { b.cyl(r + 0.2, r + 0.3, 0.4, '#e5e7eb', x, 0.2, z, 0, 0, 0, 'gloss', 24); b.box(1.2, 1.4, 1.2, 0.1, '#cbd5e1', x + r * 0.8, 0.7, z + r * 0.6); g2.sph(0.15, '#22d3ee', x + r * 0.8, 1.5, z + r * 0.6, 1, 1, 1, 0, 0, 0, 'glow'); });
    const rx = -17, rz = -31; b.cyl(2.4, 2.6, 0.4, '#475569', rx, 0.2, rz, 0, 0, 0, null, 20); b.cyl(0.9, 1.0, 7, '#f8fafc', rx, 4, rz, 0, 0, 0, 'gloss', 18); b.cone(0.9, 2.2, '#ef4444', rx, 8.6, rz, 0, 0, 0, 'gloss', 18); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; b.box(0.1, 1.8, 1.3, 0.05, '#ef4444', rx + Math.cos(a) * 1.1, 1.3, rz + Math.sin(a) * 1.1, 0, -a, 0); } g2.sph(0.32, '#7dd3fc', rx, 5.4, rz + 0.86, 1, 1, 0.4, 0, 0, 0, 'glow'); b.box(0.5, 9, 0.5, 0.05, '#64748b', rx - 2.6, 4.5, rz); b.box(2.2, 0.3, 0.3, 0.05, '#64748b', rx - 1.6, 7, rz);
    b.cyl(0.12, 0.15, 3, '#94a3b8', -14, 1.5, 10); b.geo(new T.SphereGeometry(1.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), '#e2e8f0', -14, 3.4, 10, -0.9, 0.6, 0, 1, 1, 1, 'gloss'); g2.sph(0.15, '#ef4444', -14, 4.8, 10.6, 1, 1, 1, 0, 0, 0, 'glow');
    b.box(2.2, 0.5, 1.4, 0.15, '#f1f5f9', 9, 0.7, -9); [[-0.8, -0.7], [0.8, -0.7], [-0.8, 0.7], [0.8, 0.7]].forEach(([a, c2]) => b.cyl(0.32, 0.32, 0.25, '#1f2937', 9 + a, 0.32, -9 + c2, Math.PI / 2, 0, 0, null, 12)); b.box(0.9, 0.5, 0.7, 0.1, '#fbbf24', 9.4, 1.2, -9);
    b.cyl(0.03, 0.03, 2.6, '#e5e7eb', -6, 1.3, 13); b.box(1.1, 0.7, 0.03, 0.01, '#16a34a', -5.4, 2.2, 13); g2.sph(0.18, '#e6ff3b', -5.4, 2.2, 13.03, 1, 1, 0.2, 0, 0, 0, 'glow');
    // glowing court rail + light pylons
    [-1, 1].forEach((s) => { g2.box(D.HW * 2 + 4.4, 0.06, 0.08, 0.02, '#22d3ee', 0, 0.03, s * (D.HL + 3), 0, 0, 0, 'glow'); g2.box(0.08, 0.06, D.HL * 2 + 6, 0.02, '#22d3ee', s * (D.HW + 2.2), 0.03, 0, 0, 0, 0, 'glow'); });
    [[-6, -10], [6, -10], [-6, 10], [6, 10]].forEach(([x, z]) => { b.cyl(0.12, 0.16, 6, '#334155', x, 3, z, 0, 0, 0, 'gloss'); g2.box(0.9, 0.3, 0.3, 0.05, '#e0f2fe', x, 6, z, 0, Math.atan2(-x, -z), 0, 'glow'); });
    // astronaut fans in low-gravity bleachers
    const seats = []; H.bleacher(b, -(D.HW + 4.6), 0, Math.PI / 2, 3, 12, '#64748b', seats); H.bleacher(b, D.HW + 7.6, 0, -Math.PI / 2, 3, 12, '#64748b', seats);
    /* ---- dense lunar dressing in front of the camera (behind the far baseline) and along the sides ---- */
    const DH = D.HL, rock = (x, z, r, col) => b.geo(new T.DodecahedronGeometry(r, 0), col || ['#6b7280', '#52525b', '#78716c', '#4b5563'][(rnd() * 4) | 0], x, r * 0.45, z, rnd() * 3, rnd() * 3, 0, 1, 0.6 + rnd() * 0.5, 1);
    // metal deck + glowing edge
    b.box(D.HW * 2 + 9, 0.08, DH * 2 + 11, 0.03, '#1f2937', 0, -0.06, 0);
    // rimmed craters (raised rim ring + dark floor)
    [[-9, -19, 2.4], [11, -17, 1.8], [-3, -34, 3.4], [16, -40, 4], [-20, -26, 2.6], [5, -52, 5], [-16, -55, 4.5], [24, -28, 2.2], [-26, -12, 2], [27, -8, 2.4], [-30, 6, 3], [30, 14, 2.6]].forEach(([x, z, r]) => {
      b.geo(new T.TorusGeometry(r, r * 0.22, 6, 22), '#6b7280', x, 0.05, z, Math.PI / 2, 0, 0, 1, 1, 0.55);
      b.cyl(r * 0.95, r * 0.95, 0.05, '#2a2d35', x, 0.02, z, 0, 0, 0, null, 22);
      for (let k = 0; k < 4; k++) { const a = rnd() * Math.PI * 2; rock(x + Math.cos(a) * r * 1.35, z + Math.sin(a) * r * 1.35, 0.25 + rnd() * 0.35); } });
    // rocks everywhere (kept off the court, stands and base)
    for (let i = 0; i < 140; i++) { const x = (rnd() - 0.5) * 90, z = -12 - rnd() * 70 + (i % 3 === 0 ? 50 : 0); if (Math.abs(x) < D.HW + 9 && z > -DH - 9) continue; if (Math.abs(x) < 9 && z > -DH - 12) continue; rock(x, z, 0.2 + rnd() * (rnd() < 0.15 ? 1.4 : 0.6)); }
    // back stand full of astronaut + alien fans
    const backZ = -(DH + 5.2), fanSeats = []; H.bleacher(b, 0, backZ, 0, 4, 15, '#475569', fanSeats);
    g2.box(15.2, 0.08, 0.08, 0.02, '#22d3ee', 0, 0.32, backZ + 0.25, 0, 0, 0, 'glow'); g2.box(15.2, 0.08, 0.08, 0.02, '#ff4fd8', 0, 0.32 + 4 * 0.42, backZ - 3 * 0.62 - 0.2, 0, 0, 0, 'glow');
    const suit = ['#f8fafc', '#e2e8f0', '#fde68a', '#fecaca'], alien = ['#4ade80', '#a3e635', '#2dd4bf', '#c084fc'];
    fanSeats.forEach((st, i) => { if (rnd() < 0.18) return; const x = st.x + (rnd() - 0.5) * 0.1, y = st.y, z = st.z, up = (rnd() < 0.35) ? 0.35 : 0;
      if (rnd() < 0.55) { // astronaut: suit, backpack, bubble helmet with gold visor
        const c1 = suit[(rnd() * 4) | 0]; b.cap(0.17, 0.26, c1, x, y + 0.32, z); b.box(0.26, 0.28, 0.12, 0.04, '#94a3b8', x, y + 0.36, z - 0.15);
        b.sph(0.19, '#ffffff', x, y + 0.72, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.14, '#f59e0b', x, y + 0.72, z + 0.08, 1, 0.8, 0.6, 0, 0, 0, 'gloss');
        b.cap(0.05, 0.22, c1, x - 0.2, y + 0.5 + up, z, 0, 0, up ? 0.3 : 1.1); b.cap(0.05, 0.22, c1, x + 0.2, y + 0.5 + up, z, 0, 0, up ? -0.3 : -1.1);
        if (rnd() < 0.3) g2.sph(0.05, ['#22d3ee', '#ff4fd8', '#e6ff3b'][(rnd() * 3) | 0], x + 0.24, y + 0.85, z + 0.05, 1, 1, 1, 0, 0, 0, 'glow');
      } else { // alien: big head, black eyes, antennae with glowing tips
        const c1 = alien[(rnd() * 4) | 0]; b.cap(0.14, 0.22, c1, x, y + 0.28, z); b.sph(0.22, c1, x, y + 0.66, z, 1.1, 0.95, 1, 0, 0, 0, 'gloss');
        b.sph(0.06, '#111827', x - 0.08, y + 0.68, z + 0.18, 1, 1.4, 0.6, 0, 0, 0, 'gloss'); b.sph(0.06, '#111827', x + 0.08, y + 0.68, z + 0.18, 1, 1.4, 0.6, 0, 0, 0, 'gloss');
        [-1, 1].forEach((sg) => { b.cyl(0.012, 0.012, 0.22, c1, x + sg * 0.1, y + 0.92, z, 0, 0, sg * -0.35); g2.sph(0.045, '#e6ff3b', x + sg * 0.15, y + 1.03, z, 1, 1, 1, 0, 0, 0, 'glow'); });
        if (up) { b.cap(0.045, 0.24, c1, x - 0.18, y + 0.62, z, 0, 0, 0.25); b.cap(0.045, 0.24, c1, x + 0.18, y + 0.62, z, 0, 0, -0.25); } } });
    // giant scoreboard screen above the back stand
    b.box(0.25, 5.2, 0.25, 0.05, '#334155', -5, 2.6, backZ - 3.4); b.box(0.25, 5.2, 0.25, 0.05, '#334155', 5, 2.6, backZ - 3.4); b.box(10.6, 2.6, 0.3, 0.1, '#0f172a', 0, 6.2, backZ - 3.4, 0, 0, 0, 'gloss');
    g2.box(10, 2.1, 0.05, 0.02, '#1d4ed8', 0, 6.2, backZ - 3.22, 0, 0, 0, 'glow'); g2.box(10.2, 0.1, 0.06, 0.02, '#22d3ee', 0, 7.5, backZ - 3.2, 0, 0, 0, 'glow'); g2.box(10.2, 0.1, 0.06, 0.02, '#22d3ee', 0, 4.9, backZ - 3.2, 0, 0, 0, 'glow');
    // the base: domes linked by tube modules, with glowing windows
    const dome = (x, z, r, col) => { b.geo(new T.SphereGeometry(r, 26, 14, 0, Math.PI * 2, 0, Math.PI / 2), col || '#e5e7eb', x, 0, z, 0, 0, 0, 1, 0.85, 1, 'gloss'); b.cyl(r + 0.15, r + 0.25, 0.5, '#94a3b8', x, 0.25, z, 0, 0, 0, null, 26);
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; g2.box(r * 0.22, 0.22, 0.05, 0.02, k % 2 ? '#fde68a' : '#7dd3fc', x + Math.sin(a) * r * 0.93, r * 0.35, z + Math.cos(a) * r * 0.93, 0, a, 0, 'glow'); }
      b.cyl(0.08, 0.08, 1.4, '#cbd5e1', x, r * 0.85 + 0.7, z); g2.sph(0.14, '#ef4444', x, r * 0.85 + 1.45, z, 1, 1, 1, 0, 0, 0, 'glow'); };
    const tube = (x1, z1, x2, z2) => { const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), a = Math.atan2(dx, dz); b.cyl(0.85, 0.85, L, '#cbd5e1', (x1 + x2) / 2, 0.9, (z1 + z2) / 2, Math.PI / 2, 0, 0, 'gloss', 16);
      for (let k = 1; k < L / 2; k++) { const t = k * 2 / L; b.tor(0.88, 0.07, '#64748b', x1 + dx * t, 0.9, z1 + dz * t, 0, a, 0); g2.box(0.4, 0.22, 0.05, 0.02, '#7dd3fc', x1 + dx * t + Math.cos(a) * 0.86, 1.05, z1 + dz * t - Math.sin(a) * 0.86, 0, a + Math.PI / 2, 0, 'glow'); } };
    dome(-10, -24, 4.4); dome(7, -27, 3.6, '#f1f5f9'); dome(19, -19, 3, '#e2e8f0'); dome(-22, -14, 2.8); dome(-4, -40, 5.5, '#f8fafc');
    tube(-6, -25, 3.6, -26.6); tube(10.4, -25.5, 16.4, -20.5); tube(-13.6, -21.6, -19.6, -15.6); tube(-6.8, -27.6, -4, -34.6);
    // solar panel field
    for (let i = 0; i < 6; i++) { const x = 13 + (i % 3) * 3.2, z = -33 - Math.floor(i / 3) * 3; b.cyl(0.06, 0.06, 1.2, '#94a3b8', x, 0.6, z); b.box(2.6, 0.06, 1.6, 0.02, '#1e3a8a', x, 1.25, z, -0.5, 0, 0, 'gloss'); g2.box(2.5, 0.02, 0.04, 0.01, '#38bdf8', x, 1.29, z + 0.02, -0.5, 0, 0, 'glow'); }
    // lunar rover parked by the stand
    const rvx = -11.5, rvz = -14.5; b.box(2.8, 0.5, 1.7, 0.15, '#e5e7eb', rvx, 0.95, rvz, 0, 0.4, 0, 'gloss'); b.box(1.2, 0.5, 1.4, 0.1, '#f59e0b', rvx - 0.5, 1.45, rvz - 0.2, 0, 0.4, 0, 'gloss');
    [-1, 0, 1].forEach((k) => [-1, 1].forEach((sd) => { const lx = k * 1.05, lz = sd * 0.95, c4 = Math.cos(0.4), s4 = Math.sin(0.4); b.cyl(0.38, 0.38, 0.3, '#1f2937', rvx + lx * c4 + lz * s4, 0.4, rvz - lx * s4 + lz * c4, 0, 0.4, Math.PI / 2, null, 14); }));
    b.cyl(0.03, 0.03, 1.6, '#cbd5e1', rvx + 0.6, 2.0, rvz + 0.3); b.geo(new T.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), '#f8fafc', rvx + 0.6, 2.9, rvz + 0.3, -1, 0.4, 0, 1, 1, 1, 'gloss');
    g2.sph(0.12, '#fef9c3', rvx + 1.4 * Math.cos(0.4) + 0.4 * Math.sin(0.4), 1.0, rvz - 1.4 * Math.sin(0.4) + 0.4 * Math.cos(0.4), 1, 1, 1, 0, 0, 0, 'glow'); g2.sph(0.12, '#fef9c3', rvx + 1.4 * Math.cos(0.4) - 0.4 * Math.sin(0.4), 1.0, rvz - 1.4 * Math.sin(0.4) - 0.4 * Math.cos(0.4), 1, 1, 1, 0, 0, 0, 'glow');
    // second rover on the right
    b.box(2.2, 0.45, 1.4, 0.12, '#f1f5f9', 12.5, 0.9, -13.5, 0, -0.5, 0, 'gloss'); b.box(0.9, 0.4, 1.1, 0.1, '#ef4444', 12.9, 1.3, -13.7, 0, -0.5, 0, 'gloss'); [[-0.8, -0.7], [0.8, -0.7], [-0.8, 0.7], [0.8, 0.7]].forEach(([a, c2]) => b.cyl(0.33, 0.33, 0.26, '#1f2937', 12.5 + a * Math.cos(0.5) - c2 * Math.sin(0.5), 0.36, -13.5 + a * Math.sin(0.5) + c2 * Math.cos(0.5), 0, -0.5, Math.PI / 2, null, 12));
    // flags along the back
    [[-9, -12.5, '#ef4444'], [-6, -12.6, '#22d3ee'], [6, -12.6, '#e6ff3b'], [9, -12.5, '#ff4fd8'], [-15, -20, '#4ade80'], [15, -24, '#f97316'], [2, -31, '#a78bfa']].forEach(([x, z, c3]) => { b.cyl(0.035, 0.035, 3, '#e5e7eb', x, 1.5, z, 0, 0, 0, 'gloss'); b.box(1.3, 0.8, 0.03, 0.01, c3, x + 0.67, 2.55, z); b.box(1.36, 0.04, 0.04, 0.01, '#e5e7eb', x + 0.67, 2.97, z); });
    // antenna tower with blinking beacons + big radar dish
    const tx = 24, tz = -34; for (let k = 0; k < 6; k++) { const y = k * 2.2; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, c2]) => b.cyl(0.07, 0.07, 2.2, '#cbd5e1', tx + a * (0.9 - k * 0.1), y + 1.1, tz + c2 * (0.9 - k * 0.1))); b.box(1.8 - k * 0.2, 0.06, 0.06, 0.01, '#94a3b8', tx, y + 2.2, tz + (0.9 - k * 0.1)); }
    g2.sph(0.3, '#ef4444', tx, 13.5, tz, 1, 1, 1, 0, 0, 0, 'glow'); g2.sph(0.2, '#ef4444', tx, 7.7, tz + 0.5, 1, 1, 1, 0, 0, 0, 'glow');
    b.cyl(0.3, 0.45, 3.2, '#94a3b8', -24, 1.6, -38); b.geo(new T.SphereGeometry(3.4, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2.6), '#f1f5f9', -24, 4.8, -37.4, -1.1, 0.5, 0, 1, 1, 1, 'gloss'); b.cyl(0.06, 0.06, 2.4, '#cbd5e1', -24 + 0.6, 5.6, -36.2, -1.1, 0.5, 0); g2.sph(0.2, '#22d3ee', -23.3, 6.4, -35.3, 1, 1, 1, 0, 0, 0, 'glow');
    // glowing path lights to the base + tall light towers by the stand
    for (let k = 0; k < 8; k++) { [-1, 1].forEach((sg) => { const z = -DH - 9 - k * 2.4; b.cyl(0.06, 0.08, 0.5, '#475569', sg * 2.2, 0.25, z); g2.sph(0.1, k % 2 ? '#22d3ee' : '#ff4fd8', sg * 2.2, 0.55, z, 1, 1, 1, 0, 0, 0, 'glow'); }); }
    [[-9.5, backZ - 2], [9.5, backZ - 2]].forEach(([x, z]) => { b.cyl(0.14, 0.2, 9, '#334155', x, 4.5, z, 0, 0, 0, 'gloss'); b.box(2.2, 0.9, 0.3, 0.06, '#1f2937', x, 9, z); g2.box(1.9, 0.6, 0.05, 0.02, '#f0f9ff', x, 9, z + 0.18, 0, 0, 0, 'glow'); });
    // floating holo-hoops above the court surround
    [[-7.5, 4.2, -2], [7.5, 4.6, 3]].forEach(([x, y, z]) => g2.tor(1.1, 0.06, '#22d3ee', x, y, z, 0, Math.PI / 2, 0, 'glow'));
    fin(root, b, g2);
    root.userData.crowd = H.crowdOn(root, seats, 71, 0.5);
    { // live display on the big screen
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d'); const gr = x.createLinearGradient(0, 0, 512, 128); gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(1, '#0c4a6e'); x.fillStyle = gr; x.fillRect(0, 0, 512, 128);
      x.fillStyle = '#fff'; for (let i = 0; i < 60; i++) x.fillRect(rnd() * 512, rnd() * 128, 2, 2);
      x.font = '900 54px Fredoka, Arial Black, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8; x.strokeStyle = '#ff4fd8'; x.strokeText('MOON BASE \uD83D\uDE80', 256, 58); x.fillStyle = '#e6ff3b'; x.fillText('MOON BASE \uD83D\uDE80', 256, 58);
      x.font = '700 22px Fredoka, Arial, sans-serif'; x.fillStyle = '#7dd3fc'; x.fillText('PICKLE SMASH \u00B7 LOW GRAVITY LEAGUE', 256, 106);
      const scr = new T.Mesh(new T.PlaneGeometry(10, 2.1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), fog: false })); scr.position.set(0, 6.2, -(D.HL + 5.2) - 3.18); root.add(scr);
    }
    // Earth, Saturn-ish planet, stars
    const earth = new T.Group(); earth.position.set(-46, 30, -250); root.add(earth);
    const ecv = document.createElement('canvas'); ecv.width = 256; ecv.height = 128; const ex = ecv.getContext('2d'); ex.fillStyle = '#1d4ed8'; ex.fillRect(0, 0, 256, 128); const er = U.rng(5); ex.fillStyle = '#16a34a'; for (let i = 0; i < 22; i++) { ex.beginPath(); ex.ellipse(er() * 256, 20 + er() * 88, 10 + er() * 26, 6 + er() * 16, er() * 3, 0, 7); ex.fill(); } ex.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 26; i++) { ex.beginPath(); ex.ellipse(er() * 256, er() * 128, 8 + er() * 22, 2 + er() * 4, 0, 0, 7); ex.fill(); }
    const eMesh = new T.Mesh(new T.SphereGeometry(30, 32, 20), new T.MeshBasicMaterial({ map: new T.CanvasTexture(ecv), fog: false })); earth.add(eMesh);
    const atm = new T.Mesh(new T.SphereGeometry(32.5, 32, 20), new T.MeshBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.25, fog: false, side: T.BackSide })); earth.add(atm);
    const pl = new T.Group(); pl.position.set(-120, 80, -270); root.add(pl); pl.add(new T.Mesh(new T.SphereGeometry(14, 24, 16), new T.MeshBasicMaterial({ color: '#f59e0b', fog: false }))); const ring = new T.Mesh(new T.RingGeometry(18, 27, 40), new T.MeshBasicMaterial({ color: '#fde68a', side: T.DoubleSide, transparent: true, opacity: 0.7, fog: false })); ring.rotation.x = 1.2; pl.add(ring);
    const sp = []; for (let i = 0; i < 1200; i++) { const a = rnd() * Math.PI * 2, e = -0.05 + rnd() * 1.5, r = 520; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); root.add(new T.Points(sg, new T.PointsMaterial({ color: '#ffffff', size: 1.7, sizeAttenuation: false, fog: false })));
    // a satellite drifting by
    const sat = new T.Group(); const sb = new B(); sb.box(1.2, 1.2, 1.6, 0.1, '#e5e7eb', 0, 0, 0, 0, 0, 0, 'gloss'); sb.box(4, 0.05, 1.4, 0.01, '#1e3a8a', -2.6, 0, 0); sb.box(4, 0.05, 1.4, 0.01, '#1e3a8a', 2.6, 0, 0); H.att(sat, sb, false); sat.position.set(0, 40, -80); root.add(sat);
    root.userData.anim = (t) => { eMesh.rotation.y = t * 0.05; sat.position.x = Math.sin(t * 0.06) * 90; sat.rotation.z = t * 0.2; sat.rotation.y = t * 0.1; pl.rotation.y = t * 0.03; };
    return { sun: { col: '#ffffff', pos: [14, 26, 10], k: 1.1 }, hemi: ['#c7d2fe', '#1f2937', 0.5], fog: ['#02030a', 140, 560], bg: '#02030a', night: true, spots: [[-6, 7, -10], [6, 7, 10]] };
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
    b.tor(5.5, 1.3, '#f9a8d4', 0, 9.2, -D.HL - 26, 0, 0, 0, 'gloss'); b.tor(5.5, 0.9, '#d97706', 0, 9.2, -D.HL - 26.25, 0, 0, 0, null); for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; g2.box(0.4, 0.08, 0.08, 0.01, swirl[k % 6], Math.cos(a) * 5.5, 9.2 + Math.sin(a) * 5.5, -D.HL - 24.8, 0, 0, a + 0.6); }
    [[13, 13], [17, 4]].forEach(([x, z]) => { b.cone(0.9, 2.6, '#d97706', x, 1.3, z, Math.PI, 0, 0, null, 14); b.sph(0.95, '#fbcfe8', x, 2.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.85, '#a7f3d0', x, 3.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.25, '#ef4444', x, 4.8, z); });
    /* ---- dense dressing in front of the camera ---- */
    backStand(b, g2, seats, '#f9a8d4', '#ff4fd8', '#3ff0ff');
    bigScreen(root, b, g2, '#db2777', 'CANDY STADIUM \uD83C\uDF6D', 'PICKLE SMASH \u00B7 SWEETEST COURT IN TOWN', ['#fbcfe8', '#c4b5fd', '#ffe14d', '#db2777', '#ffffff', '#831843'], rnd);
    // gumdrops + peppermints + wrapped candies scattered everywhere in view
    for (let i = 0; i < 80; i++) { const x = (rnd() - 0.5) * 70, z = -13 - rnd() * 50; if (Math.abs(x) < 9 && z > -18) continue; if (Math.abs(z + D.HL + 15) < 5.5) continue; const c1 = swirl[(rnd() * 6) | 0], k = rnd();
      if (k < 0.45) { const r = 0.4 + rnd() * 0.7; b.sph(r, c1, x, r * 0.55, z, 1, 1.1, 1, 0, 0, 0, 'gloss', 12, 8); b.cyl(r, r, 0.12, c1, x, 0.06, z, 0, 0, 0, 'gloss', 12); }
      else if (k < 0.75) { b.cyl(0.6, 0.6, 0.3, '#ffffff', x, 0.62, z, Math.PI / 2, rnd() * 3, 0, 'gloss', 16); for (let q = 0; q < 3; q++) b.box(0.18, 1.1, 0.32, 0.03, '#ef4444', x, 0.62, z, 0, 0, q * Math.PI / 3); }
      else { b.cap(0.25, 0.55, c1, x, 0.3, z, 0, rnd() * 3, Math.PI / 2, 'gloss'); } }
    // lollipop trees + candy canes right in view
    [[-8, -13.5], [8, -13.5], [-11, -19], [11, -19.5], [-6, -30], [7, -31], [-16, -27], [16, -26], [-2, -38], [12, -40], [-12, -42]].forEach(([x, z], i) => lolli(x, z, 1.1 + (i % 3) * 0.25, swirl[i % 6], '#ffffff'));
    [[-4, -13], [4, -13], [-14, -15], [14, -15]].forEach(([x, z], i) => cane(x, z, i % 2 ? Math.PI : 0));
    // gingerbread houses with icing + glowing windows
    const ginger = (x, z, s, r) => { b.box(2.6 * s, 1.9 * s, 2.2 * s, 0.1, '#b45309', x, 0.95 * s, z, 0, r, 0); b.geo(new T.CylinderGeometry(0.01, 1.85 * s, 1.5 * s, 4, 1), '#fef3c7', x, 2.65 * s, z, 0, r + Math.PI / 4, 0, 1.25, 1, 1, 'gloss');
      g2.box(0.5 * s, 0.5 * s, 0.05, 0.02, '#ffe14d', x + Math.sin(r) * 1.12 * s - Math.cos(r) * 0.6 * s, 1.1 * s, z + Math.cos(r) * 1.12 * s + Math.sin(r) * 0.6 * s, 0, r, 0, 'glow'); b.box(0.6 * s, 1.0 * s, 0.06, 0.02, '#ef4444', x + Math.sin(r) * 1.12 * s + Math.cos(r) * 0.55 * s, 0.5 * s, z + Math.cos(r) * 1.12 * s - Math.sin(r) * 0.55 * s, 0, r, 0, 'gloss');
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, c2]) => b.sph(0.22 * s, swirl[(rnd() * 6) | 0], x + a * 1.3 * s * Math.cos(r) + c2 * 1.1 * s * Math.sin(r), 1.95 * s, z - a * 1.3 * s * Math.sin(r) + c2 * 1.1 * s * Math.cos(r), 1, 1, 1, 0, 0, 0, 'gloss')); };
    ginger(-12, -31, 1.2, 0.5); ginger(13, -33, 1.1, -0.5); ginger(-20, -20, 1, 0.8); ginger(21, -19, 1, -0.8);
    // a giant layer cake tower on the horizon + cupcakes in view
    [[0, 7, 4], [0, 5.4, 3.6], [0, 3.8, 3.2]].forEach(([x, r], k) => { b.cyl(r, r, 3, ['#fbcfe8', '#fde68a', '#bae6fd'][k], x, 1.5 + k * 3, -58, 0, 0, 0, 'gloss', 24); b.tor(r, 0.35, '#ffffff', x, 3 + k * 3, -58, Math.PI / 2, 0, 0, 'gloss'); }); b.sph(1.6, '#ef4444', 0, 10.6, -58, 1, 1, 1, 0, 0, 0, 'gloss');
    cupcake(-8, -22, 1.1, '#c4b5fd'); cupcake(9, -23, 1.2, '#a7f3d0'); cupcake(3, -45, 1.8, '#fbcfe8');
    // ice cream cones by the stand
    [[-9.5, -16.5], [9.5, -16.5], [-14, -36]].forEach(([x, z]) => { b.cone(0.9, 2.6, '#d97706', x, 1.3, z, Math.PI, 0, 0, null, 14); b.sph(0.95, '#fbcfe8', x, 2.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.85, '#a7f3d0', x, 3.9, z, 1, 1, 1, 0, 0, 0, 'gloss'); b.sph(0.25, '#ef4444', x, 4.8, z, 1, 1, 1, 0, 0, 0, 'gloss'); });
    // string lights of candy bulbs over the stand
    H.stringLights(b, -8, BACKZ - 3.2, 8, BACKZ - 3.2, 8.4, 0.6, 16, swirl);
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
