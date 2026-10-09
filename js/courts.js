/* Grok Pickleball - the 5 venues: court, net and a full 3D environment each (all real geometry) */
(function () {
  'use strict';
  const PB = window.PB, U = PB.U, M = PB.M, D = PB.D, T = THREE, B = M.B;
  const C = PB.Courts = {};
  const att = (g, b, sh) => { b.meshes(sh).forEach((m) => g.add(m)); return g; };
  const rcv = (g) => { g.traverse((m) => { if (m.isMesh) m.receiveShadow = true; }); return g; };

  /* ---------- court surface, lines, net ---------- */
  function courtCore(c, root) {
    const g = new T.Group(); root.add(g);
    const b = new B();
    // apron + playing surface (slightly raised layers so nothing z-fights)
    b.box(D.HW * 2 + 4.6, 0.04, D.HL * 2 + 6.2, 0.02, c.out, 0, -0.02, 0);
    b.box(D.HW * 2, 0.012, D.HL * 2, 0.004, c.court, 0, 0.006, 0);
    [-1, 1].forEach((s) => b.box(D.HW * 2, 0.013, D.K, 0.004, c.kitchen, 0, 0.0065, s * D.K / 2));
    const surf = new T.Group(); att(surf, b, false); rcv(surf); g.add(surf);
    // lines (5 cm)
    const lb = new B(), lw = 0.05, ly = 0.016, lc = c.line;
    [-1, 1].forEach((s) => { lb.box(D.HW * 2 + lw, 0.006, lw, 0.002, lc, 0, ly, s * D.HL); lb.box(lw, 0.006, D.HL * 2, 0.002, lc, s * D.HW, ly, 0); lb.box(D.HW * 2, 0.006, lw, 0.002, lc, 0, ly, s * D.K); lb.box(lw, 0.006, D.HL - D.K, 0.002, lc, 0, ly, s * (D.K + (D.HL - D.K) / 2)); });
    const lines = new T.Group(); lb.meshes(false).forEach((m) => { if (c.neon) m.material = M.solid(lc, { emissive: lc, emissiveIntensity: 0.9 }); lines.add(m); }); rcv(lines); g.add(lines);
    // kitchen danger glow (shown by the assist kitchen warning)
    const kmat = new T.MeshBasicMaterial({ color: '#ff3b5c', transparent: true, opacity: 0, depthWrite: false });
    const kz = [];
    [-1, 1].forEach((s) => { const k = new T.Mesh(new T.PlaneGeometry(D.HW * 2, D.K), kmat.clone()); k.rotation.x = -Math.PI / 2; k.position.set(0, 0.02, s * D.K / 2); g.add(k); kz.push(k); });
    root.userData.kitchen = kz;
    // net: posts, cable, tape, mesh (real line geometry), centre strap
    const nb = new B();
    [-1, 1].forEach((s) => { nb.cyl(0.04, 0.045, 0.98, '#2b2f3a', s * D.POST, 0.49, 0, 0, 0, 0, 'gloss', 12); nb.cyl(0.13, 0.15, 0.06, '#2b2f3a', s * D.POST, 0.03, 0, 0, 0, 0, null, 14); nb.sph(0.05, '#e5e7eb', s * D.POST, 0.99, 0, 1, 1, 1, 0, 0, 0, 'gloss'); });
    // tape follows the sag
    const N = 24;
    for (let i = 0; i < N; i++) { const x0 = -D.POST + (i / N) * D.POST * 2, x1 = -D.POST + ((i + 1) / N) * D.POST * 2, xm = (x0 + x1) / 2; nb.box(x1 - x0 + 0.01, 0.06, 0.03, 0.01, '#ffffff', xm, D.netH(Math.min(D.HW, Math.abs(xm))) - 0.03, 0); }
    nb.box(0.05, D.NET_MID, 0.02, 0.01, '#ffffff', 0, D.NET_MID / 2, 0);
    const net = new T.Group(); att(net, nb, true); g.add(net);
    const pts = [], step = 0.045;
    for (let x = -D.POST; x <= D.POST + 1e-6; x += step) { const h = D.netH(Math.min(D.HW, Math.abs(x))) - 0.06; pts.push(x, 0.03, 0, x, h, 0); }
    for (let y = 0.03; y < D.NET_SIDE - 0.05; y += step) { for (let i = 0; i < N; i++) { const x0 = -D.POST + (i / N) * D.POST * 2, x1 = -D.POST + ((i + 1) / N) * D.POST * 2; if (y > D.netH(Math.min(D.HW, Math.abs(x0))) - 0.06) continue; pts.push(x0, y, 0, x1, y, 0); } }
    const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    const mesh = new T.LineSegments(lg, new T.LineBasicMaterial({ color: c.neon ? '#ff9ff0' : '#1f2430', transparent: true, opacity: c.neon ? 0.6 : 0.75 }));
    g.add(mesh);
    const veil = new T.Mesh(new T.PlaneGeometry(D.POST * 2, D.NET_MID - 0.08), new T.MeshBasicMaterial({ color: c.neon ? '#ff4fd8' : '#0f172a', transparent: true, opacity: c.neon ? 0.1 : 0.16, side: T.DoubleSide, depthWrite: false }));
    veil.position.set(0, (D.NET_MID - 0.08) / 2 + 0.02, 0); g.add(veil);
    root.userData.net = { group: net, mesh, veil };
    return g;
  }

  /* ---------- shared props ---------- */
  function bleacher(b, x, z, ry, rows, len, col, seats) {
    const cs = Math.cos(ry), sn = Math.sin(ry), P = (lx, ly, lz) => [x + lx * cs + lz * sn, ly, z - lx * sn + lz * cs];
    for (let r = 0; r < rows; r++) {
      let p = P(0, 0.25 + r * 0.42, -r * 0.62); b.box(len, 0.1, 0.42, 0.04, col, p[0], p[1] + 0.2, p[2], 0, ry, 0);
      p = P(0, 0.2 + r * 0.42, -r * 0.62 - 0.12); b.box(len, 0.4 + r * 0.42, 0.06, 0.02, M.darker(col, 0.25), p[0], (0.4 + r * 0.42) / 2, p[2], 0, ry, 0);
      for (let i = 0; i < len / 0.55; i++) { const lx = -len / 2 + 0.3 + i * 0.55; const q = P(lx, 0.36 + r * 0.42, -r * 0.62 + 0.04); if (seats) seats.push({ x: q[0], y: q[1] - 0.06, z: q[2], ry: ry + Math.PI }); }
    }
    [-1, 1].forEach((s) => { const p = P(s * len / 2, (rows * 0.42) / 2, -(rows - 1) * 0.31); b.box(0.08, rows * 0.42 + 0.3, rows * 0.62, 0.03, '#94a3b8', p[0], p[1], p[2], 0, ry, 0, 'gloss'); });
  }
  function tree(b, x, z, s, rnd, cols) {
    const h = (2.6 + rnd() * 1.8) * s;
    b.cyl(0.14 * s, 0.26 * s, h, '#7a4b2a', x, h / 2, z, 0, 0, 0, null, 9);
    const fc = cols || ['#2f9e44', '#37b24d', '#40c057', '#2b8a3e'];
    for (let i = 0; i < 5; i++) { const a = rnd() * Math.PI * 2, r = (i ? 0.7 : 0) * s, fy = h + (i ? -0.3 + rnd() * 0.8 : 0.4) * s; b.sph((1.0 + rnd() * 0.5) * s, fc[Math.floor(rnd() * fc.length)], x + Math.cos(a) * r, fy, z + Math.sin(a) * r, 1, 0.88, 1, 0, 0, 0, null, 12, 9); }
  }
  function bush(b, x, z, s, col) { b.sph(0.6 * s, col, x, 0.35 * s, z, 1.3, 0.8, 1); b.sph(0.45 * s, M.lighter(col, 0.06), x + 0.4 * s, 0.4 * s, z + 0.1, 1, 0.8, 1); b.sph(0.4 * s, M.darker(col, 0.05), x - 0.45 * s, 0.32 * s, z - 0.1, 1, 0.8, 1); }
  function lamp(b, x, z, h, col, glowCol) { b.cyl(0.07, 0.1, h, col, x, h / 2, z, 0, 0, 0, 'gloss', 10); b.box(0.9, 0.12, 0.5, 0.05, col, x, h, z, 0, 0, 0, 'gloss'); b.box(0.8, 0.05, 0.4, 0.02, glowCol || '#fffbe0', x, h - 0.08, z, 0, 0, 0, 'glow'); }
  function fence(b, w, d, h, col, panelCol) { // side fences (posts, rails, windscreens); the ends stay open so the camera sees the court
    const posts = [];
    posts.forEach(([x, z]) => b.cyl(0.05, 0.05, h, col, x, h / 2, z, 0, 0, 0, 'gloss', 8));
    for (let z = -d / 2; z <= d / 2 + 0.01; z += 3) posts.push([-w / 2, z], [w / 2, z]);
    [0.08, h].forEach((y) => { b.cyl(0.03, 0.03, d, col, -w / 2, y, 0, Math.PI / 2, 0, 0, 'gloss', 6); b.cyl(0.03, 0.03, d, col, w / 2, y, 0, Math.PI / 2, 0, 0, 'gloss', 6); });
    if (panelCol) { for (let z = -d / 2 + 1.5; z < d / 2; z += 3) [-1, 1].forEach((s) => b.box(0.03, h * 0.55, 2.9, 0.01, panelCol, s * w / 2, h * 0.3, z)); }
  }
  function chainLink(root, w, d, h, col) { // diamond mesh as real line geometry
    const pts = [], st = 0.22;
    const side = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / st); for (let i = -Math.ceil(h / st); i <= n; i++) { const a = i * st, b0 = a + h; const p0 = Math.max(0, a), p1 = Math.min(L, b0); if (p1 <= p0) continue; const y0 = p0 - a, y1 = p1 - a; pts.push(x0 + (x1 - x0) * p0 / L, y0, z0 + (z1 - z0) * p0 / L, x0 + (x1 - x0) * p1 / L, y1, z0 + (z1 - z0) * p1 / L); const q0 = Math.max(0, a), q1 = Math.min(L, b0); pts.push(x0 + (x1 - x0) * q0 / L, h - (q0 - a), z0 + (z1 - z0) * q0 / L, x0 + (x1 - x0) * q1 / L, h - (q1 - a), z0 + (z1 - z0) * q1 / L); } };
    side(-w / 2, -d / 2, -w / 2, d / 2); side(w / 2, -d / 2, w / 2, d / 2);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    root.add(new T.LineSegments(g, new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.55 })));
  }
  function clouds(root, rnd, n, r, y) {
    const b = new B(); for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = r * (0.7 + rnd() * 0.5), x = Math.cos(a) * d, z = Math.sin(a) * d - r * 0.2, cy = y + rnd() * 20; for (let k = 0; k < 5; k++) b.sph(6 + rnd() * 6, '#ffffff', x + (k - 2) * 7, cy + (k % 2) * 3, z + rnd() * 4, 1, 0.6, 0.8, 0, 0, 0, null, 10, 7); }
    const g = new T.Group(); b.meshes(false).forEach((m) => { m.material = new T.MeshBasicMaterial({ vertexColors: true, fog: false }); g.add(m); }); root.add(g); return g;
  }
  function skyDome(root, top, bot) {
    const g = new T.SphereGeometry(600, 24, 14), col = [], a = new T.Color(top), b = new T.Color(bot), c = new T.Color();
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = U.clamp(p.getY(i) / 600, -0.1, 1); c.copy(b).lerp(a, Math.pow(Math.max(0, k), 0.6)); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })); m.renderOrder = -1; root.add(m); return m;
  }
  function ground(root, size, cols, rnd, segs, hfn) {
    const g = new T.PlaneGeometry(size, size, segs || 60, segs || 60); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = [], c = new T.Color(), c2 = new T.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const h = hfn ? hfn(x, z) : 0; p.setY(i, h); const n = U.fbm(x * 0.08, z * 0.08, 3) * 0.5 + 0.5; c.set(cols[0]); c2.set(cols[1]); c.lerp(c2, n); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); m.receiveShadow = true; m.position.y = -0.045; root.add(m); return m;
  }
  function crowdOn(root, seats, seed, frac, stand) { const rnd = U.rng(seed); const sp = seats.filter(() => rnd() < frac).map((s) => Object.assign({}, s, stand ? { stand: true } : {})); if (M.low) sp.splice(Math.floor(sp.length * 0.55)); const cr = M.crowd(sp, seed, 3); root.add(cr); return cr; }
  function stringLights(b, x0, z0, x1, z1, h, sag, n, cols) { for (let i = 0; i <= n; i++) { const t = i / n, x = U.lerp(x0, x1, t), z = U.lerp(z0, z1, t), y = h - Math.sin(t * Math.PI) * sag; b.sph(0.07, cols[i % cols.length], x, y, z, 1, 1.25, 1, 0, 0, 0, 'glow', 8, 6); if (i < n) { const t2 = (i + 0.5) / n; b.cyl(0.008, 0.008, Math.hypot(x1 - x0, z1 - z0) / n, '#222', U.lerp(x0, x1, t2), h - Math.sin(t2 * Math.PI) * sag + 0.06, U.lerp(z0, z1, t2), 0, Math.atan2(x1 - x0, z1 - z0), Math.PI / 2, null, 4); } } }

  /* ---------- venues ---------- */
  const BUILD = {};
  BUILD.park = function (root, c, rnd) {
    skyDome(root, '#3d9bff', '#d6f0ff');
    ground(root, 420, ['#4cb84a', '#78d05a'], rnd, 70, (x, z) => { const d = Math.hypot(x, z); return d > 60 ? (d - 60) * 0.08 + U.fbm(x * 0.02, z * 0.02) * 6 : 0; });
    const b = new B(), g2 = new B();
    // path, fence + windscreens, benches, lamps
    g2.box(3.2, 0.03, 60, 0.01, '#e8d9b8', D.HW + 6.5, -0.01, 0);
    fence(b, D.HW * 2 + 6, D.HL * 2 + 8, 3, '#1f2937', '#166534'); chainLink(root, D.HW * 2 + 6, D.HL * 2 + 8, 3, '#374151'); b.box(D.HW * 2 + 6, 1.1, 0.06, 0.02, '#166534', 0, 0.55, -(D.HL + 4)); for (let x = -D.HW - 3; x <= D.HW + 3.01; x += 3) b.cyl(0.05, 0.05, 1.2, '#1f2937', x, 0.6, -(D.HL + 4), 0, 0, 0, 'gloss', 8);
    [-1, 1].forEach((s) => { b.box(1.6, 0.08, 0.45, 0.04, '#b45309', s * (D.HW + 2.3), 0.45, -1.5, 0, s * Math.PI / 2); b.box(1.6, 0.4, 0.06, 0.03, '#b45309', s * (D.HW + 2.55), 0.75, -1.5, 0, s * Math.PI / 2); [-0.6, 0.6].forEach((o) => b.box(0.06, 0.45, 0.4, 0.02, '#1f2937', s * (D.HW + 2.3), 0.22, -1.5 + o)); });
    lamp(b, -D.HW - 3.2, -D.HL - 4.2, 7, '#334155'); lamp(b, D.HW + 3.2, D.HL + 4.2, 7, '#334155'); lamp(b, D.HW + 3.2, -D.HL - 4.2, 7, '#334155'); lamp(b, -D.HW - 3.2, D.HL + 4.2, 7, '#334155');
    // bleachers (both long sides, outside fence) with fans
    const seats = [];
    bleacher(b, -(D.HW + 5.2), 0, Math.PI / 2, 4, 11, '#60a5fa', seats); bleacher(b, D.HW + 9.8, 0, -Math.PI / 2, 4, 11, '#60a5fa', seats);
    // fountain
    const fx = -14, fz = -18; b.cyl(2.6, 2.8, 0.5, '#cbd5e1', fx, 0.25, fz, 0, 0, 0, null, 24); g2.cyl(2.3, 2.3, 0.05, '#38bdf8', fx, 0.48, fz, 0, 0, 0, 'gloss', 24); b.cyl(0.25, 0.35, 1.6, '#cbd5e1', fx, 1.0, fz, 0, 0, 0, null, 12); b.cyl(1.0, 0.7, 0.25, '#cbd5e1', fx, 1.8, fz, 0, 0, 0, null, 18); g2.sph(0.5, '#7dd3fc', fx, 2.1, fz, 1, 0.5, 1, 0, 0, 0, 'gloss');
    // picnic tables, trash cans, bikes rack, water fountain
    [[12, 14], [15, -12]].forEach(([x, z]) => { b.box(2, 0.08, 0.9, 0.03, '#a16207', x, 0.75, z); [-0.65, 0.65].forEach((o) => b.box(2, 0.06, 0.3, 0.02, '#a16207', x, 0.45, z + o)); [-0.8, 0.8].forEach((o) => b.box(0.08, 0.75, 1.6, 0.02, '#78350f', x + o, 0.37, z, 0.0)); });
    [[D.HW + 2.2, D.HL + 2.5], [-D.HW - 2.2, -D.HL - 2.5]].forEach(([x, z]) => { b.cyl(0.28, 0.25, 0.85, '#15803d', x, 0.42, z, 0, 0, 0, null, 14); b.cyl(0.3, 0.3, 0.06, '#166534', x, 0.87, z, 0, 0, 0, null, 14); });
    // ball cart with pickleballs
    b.box(0.6, 0.5, 0.6, 0.08, '#475569', -D.HW - 1.6, 0.35, D.HL + 1.8); for (let i = 0; i < 14; i++) g2.sph(0.07, '#e6ff3b', -D.HW - 1.6 + (rnd() - 0.5) * 0.45, 0.62 + rnd() * 0.08, D.HL + 1.8 + (rnd() - 0.5) * 0.45, 1, 1, 1, 0, 0, 0, 'gloss', 8, 6);
    // trees + bushes ring
    for (let i = 0; i < (M.low ? 26 : 46); i++) { const a = rnd() * Math.PI * 2, d = 20 + rnd() * 30, x = Math.cos(a) * d * 1.1, z = Math.sin(a) * d; if (Math.abs(x) < 14 && Math.abs(z) < 13) continue; tree(b, x, z, 0.9 + rnd() * 0.6, rnd); }
    for (let i = 0; i < 18; i++) { const s = i % 2 ? 1 : -1; bush(b, s * (D.HW + 3.6 + rnd() * 0.6), -10 + i * 1.2, 0.8 + rnd() * 0.4, ['#2f9e44', '#40c057', '#51cf66'][i % 3]); }
    for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = 13 + rnd() * 8; g2.sph(0.12, ['#ff6b9a', '#ffd43b', '#ffffff', '#c084fc'][i % 4], Math.cos(a) * d, 0.08, Math.sin(a) * d, 1, 0.6, 1); }
    // far court (second court with its own net) for depth
    g2.box(D.HW * 2 + 2, 0.02, D.HL * 2 + 3, 0.01, '#2f7fd6', -(D.HW * 2 + 9), -0.005, -3); g2.box(D.POST * 2, 0.9, 0.03, 0.01, '#1f2937', -(D.HW * 2 + 9), 0.45, -3);
    const g = new T.Group(); att(g, b, true); att(g, g2, false); rcv(g); root.add(g);
    root.userData.crowd = crowdOn(root, seats, 11, 0.55);
    root.userData.clouds = clouds(root, rnd, 9, 230, 70);
    return { sun: { col: '#fff4e0', pos: [18, 30, 14], k: 1.05 }, hemi: ['#d8efff', '#4f7a3a', 0.62], fog: ['#cfe8ff', 90, 380], bg: '#9fd8ff' };
  };
  BUILD.gym = function (root, c, rnd) {
    const b = new B(), g2 = new B(), W = 26, L = 40, H = 11;
    // wooden plank floor (real planks)
    const woods = ['#d69a5b', '#c98a4b', '#ddA866', '#cf9150'];
    for (let x = -W / 2; x < W / 2; x += 0.5) g2.box(0.49, 0.04, L, 0.005, woods[Math.floor(rnd() * 4)].toLowerCase(), x + 0.25, -0.035, 0);
    // walls with windows, ceiling trusses, lights
    b.box(W, H, 0.4, 0.05, '#e9e1f5', 0, H / 2, -L / 2); b.box(W, H, 0.4, 0.05, '#e9e1f5', 0, H / 2, L / 2); b.box(0.4, H, L, 0.05, '#ece5f7', -W / 2, H / 2, 0); b.box(0.4, H, L, 0.05, '#ece5f7', W / 2, H / 2, 0);
    b.box(W, 1.6, 0.42, 0.05, '#7c3aed', 0, 0.8, -L / 2 + 0.01); b.box(W, 1.6, 0.42, 0.05, '#7c3aed', 0, 0.8, L / 2 - 0.01); b.box(0.42, 1.6, L, 0.05, '#7c3aed', -W / 2 + 0.01, 0.8, 0); b.box(0.42, 1.6, L, 0.05, '#7c3aed', W / 2 - 0.01, 0.8, 0);
    for (let z = -L / 2 + 4; z < L / 2 - 2; z += 5) [-1, 1].forEach((s) => g2.box(0.1, 2.2, 3.4, 0.05, '#bfe6ff', s * (W / 2 - 0.22), 8, z, 0, 0, 0, 'glow'));
    b.box(W, 0.4, L, 0.05, '#4c3a6b', 0, H, 0);
    for (let z = -L / 2 + 3; z < L / 2; z += 4.5) { b.box(W, 0.35, 0.35, 0.05, '#6b5a8a', 0, H - 0.6, z); for (let x = -9; x <= 9; x += 6) { b.cyl(0.02, 0.02, 1.8, '#333', x, H - 1.6, z); b.cyl(0.6, 0.35, 0.45, '#1f2937', x, H - 2.6, z, 0, 0, 0, null, 14); g2.cyl(0.55, 0.55, 0.04, '#fffbe6', x, H - 2.84, z, 0, 0, 0, 'glow', 14); } }
    // bleachers both sides with fans
    const seats = [];
    bleacher(b, -(D.HW + 4.4), 0, Math.PI / 2, 6, 24, '#f59e0b', seats); bleacher(b, D.HW + 7.9, 0, -Math.PI / 2, 6, 24, '#f59e0b', seats);
    // banners from the ceiling
    const bc = ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#ec4899'];
    for (let i = 0; i < 5; i++) { const x = -8 + i * 4; b.box(2.2, 3.2, 0.06, 0.04, bc[i], x, H - 2.6, -L / 2 + 0.5); b.box(2.2, 0.5, 0.07, 0.02, '#ffffff', x, H - 1.6, -L / 2 + 0.51); b.cone(0.5, 0.6, bc[i], x, H - 4.4, -L / 2 + 0.5, Math.PI, 0, 0, null, 3); g2.sph(0.35, '#ffffff', x, H - 2.9, -L / 2 + 0.55, 1, 1, 0.2, 0, 0, 0, 'glow'); }
    // basketball hoops at both ends
    [-1, 1].forEach((s) => { const z = s * (L / 2 - 0.6); b.box(1.8, 1.05, 0.06, 0.02, '#ffffff', 0, 3.6, z); b.box(0.6, 0.45, 0.07, 0.01, '#ef4444', 0, 3.4, z - s * 0.01); b.tor(0.23, 0.02, '#f97316', 0, 3.05, z - s * 0.35, Math.PI / 2, 0, 0, 'gloss'); b.cyl(0.06, 0.06, 1.2, '#6b7280', 0, 4.6, z + s * 0.4, Math.PI / 2, 0, 0); });
    // scoreboard frame (digits are live, see view)
    b.box(5, 2.2, 0.5, 0.15, '#111827', 0, H - 3.6, -L / 2 + 0.6); 
    // mats, water cooler, ball racks, benches
    [-1, 1].forEach((s) => { b.box(3, 0.12, 1.2, 0.05, '#2563eb', s * 10.5, 0.06, -15); b.cyl(0.25, 0.25, 0.5, '#60a5fa', s * (D.HW + 1.8), 1.0, D.HL + 2.4, 0, 0, 0, 'gloss', 14); b.box(0.5, 0.75, 0.5, 0.05, '#e5e7eb', s * (D.HW + 1.8), 0.37, D.HL + 2.4); b.box(2.4, 0.08, 0.45, 0.04, '#1e3a8a', s * (D.HW + 1.6), 0.45, -4); [-1, 1].forEach((o) => b.box(0.06, 0.45, 0.4, 0.02, '#111827', s * (D.HW + 1.6) + o * 1.1, 0.22, -4)); });
    for (let i = 0; i < 12; i++) g2.sph(0.12, i % 2 ? '#f97316' : '#e6ff3b', -11 + (i % 6) * 0.3, 0.3 + Math.floor(i / 6) * 0.3, 16, 1, 1, 1, 0, 0, 0, 'gloss');
    const g = new T.Group(); att(g, b, true); att(g, g2, false); rcv(g); root.add(g);
    root.userData.crowd = crowdOn(root, seats, 21, 0.5);
    root.userData.board = { x: 0, y: H - 3.6, z: -L / 2 + 0.87, w: 4.6, h: 1.9 };
    return { sun: { col: '#fff8ec', pos: [4, 20, 6], k: 0.75 }, hemi: ['#fff7ec', '#b0794a', 0.9], fog: ['#3a2a55', 60, 200], bg: '#3a2a55', indoor: true };
  };
  BUILD.beach = function (root, c, rnd) {
    skyDome(root, '#2aa6ff', '#ffe2b0');
    ground(root, 420, ['#f2d38f', '#ffe6ad'], rnd, 80, (x, z) => { const dz = z + 30; return (dz < 0 ? dz * 0.05 : 0) + (Math.hypot(x, z) > 16 ? U.fbm(x * 0.05, z * 0.05) * 1.2 : 0); });
    // ocean (animated in view), foam line
    const og = new T.PlaneGeometry(800, 400, M.low ? 40 : 90, M.low ? 20 : 40); og.rotateX(-Math.PI / 2); og.translate(0, -0.6, -230);
    const ocean = new T.Mesh(og, new T.MeshStandardMaterial({ color: '#13a8d8', roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.94 })); root.add(ocean); root.userData.ocean = ocean; ocean.userData.base = og.attributes.position.array.slice();
    const b = new B(), g2 = new B();
    for (let i = 0; i < 40; i++) g2.sph(1.6 + rnd(), '#ffffff', -200 + i * 10 + rnd() * 3, -0.75, -31 + rnd() * 1.5, 1.5, 0.12, 0.6);
    // palm trees (curved trunks + drooping fronds)
    const palm = (x, z, s, lean) => { let px = x, py = 0, pz = z; const seg = 9, h = 6.5 * s; for (let i = 0; i < seg; i++) { const t = i / seg, nx = x + Math.sin(lean) * Math.pow(t, 1.6) * 2.2 * s, nz = z + Math.cos(lean) * Math.pow(t, 1.6) * 2.2 * s, ny = t * h; b.cyl(0.2 * s * (1 - t * 0.35), 0.24 * s * (1 - t * 0.35), h / seg + 0.05, i % 2 ? '#a0703c' : '#8b5e34', (px + nx) / 2, (py + ny) / 2 + h / seg / 2, (pz + nz) / 2, Math.atan2(nz - pz, h / seg) * 1, 0, -Math.atan2(nx - px, h / seg)); px = nx; py = ny; pz = nz; }
      const tx = px, ty = h + 0.3, tz = pz; for (let k = 0; k < 3; k++) b.sph(0.18 * s, '#6b4423', tx + Math.cos(k * 2) * 0.15, ty - 0.15, tz + Math.sin(k * 2) * 0.15);
      for (let f = 0; f < 8; f++) { const a = f / 8 * Math.PI * 2 + rnd() * 0.3; for (let k = 0; k < 6; k++) { const t = (k + 1) / 6, r = t * 2.6 * s, y = ty + Math.sin(t * Math.PI * 0.7) * 0.9 * s - t * t * 1.6 * s; b.sph(0.38 * s * (1 - t * 0.55), k % 2 ? '#2f9e44' : '#37b24d', tx + Math.cos(a) * r, y, tz + Math.sin(a) * r, 1.4, 0.18, 0.6, 0, -a, -0.3 - t * 0.5, null, 8, 5); } } };
    const palms = [[-10, -8], [-12, 4], [11, -6], [13, 7], [-9, 15], [10, 17], [-18, -14], [19, -16], [-25, 2], [24, 4], [-7, -20], [8, -22]];
    palms.forEach(([x, z], i) => palm(x, z, 0.85 + rnd() * 0.35, rnd() * Math.PI * 2));
    // umbrellas with stripes, towels, beach balls, surfboards
    const umb = (x, z, c1, c2) => { b.cyl(0.04, 0.04, 2.4, '#e5e7eb', x, 1.2, z, 0, 0, 0, 'gloss', 6); for (let k = 0; k < 8; k++) b.geo(new T.ConeGeometry(1.4, 0.55, 2, 1, true, k / 8 * Math.PI * 2, Math.PI / 4), k % 2 ? c1 : c2, x, 2.45, z); b.sph(0.06, '#ffffff', x, 2.75, z); };
    [[-7, 10, '#ef4444'], [8, 12, '#3b82f6'], [-14, -3, '#f59e0b'], [15, -1, '#ec4899'], [-6, -16, '#22c55e']].forEach(([x, z, c1]) => { umb(x, z, c1, '#ffffff'); b.box(1.0, 0.03, 2.0, 0.01, c1, x + 1.2, 0.0, z + 0.5, 0, 0.3, 0); });
    [[6, 9, '#f43f5e'], [-11, 12, '#06b6d4']].forEach(([x, z, cc]) => { for (let k = 0; k < 6; k++) b.geo(new T.SphereGeometry(0.3, 8, 8, k / 6 * Math.PI * 2, Math.PI / 3), [cc, '#ffffff', '#facc15'][k % 3], x, 0.3, z); });
    [[-15, 8, '#f97316'], [-15.6, 8.4, '#22d3ee'], [16, 10, '#a855f7']].forEach(([x, z, cc]) => { b.cap(0.28, 1.6, cc, x, 1.0, z, 0.1, 0, 0.15); b.box(0.06, 2.0, 0.02, 0.01, '#ffffff', x, 1.0, z + 0.06, 0.1, 0, 0.15); });
    // lifeguard tower
    const lx = 16, lz = -14; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c2]) => b.cyl(0.08, 0.1, 2.6, '#f8fafc', lx + a * 0.9, 1.3, lz + c2 * 0.9)); b.box(2.4, 1.6, 2.4, 0.15, '#ef4444', lx, 3.4, lz); b.box(2.8, 0.15, 2.8, 0.05, '#f8fafc', lx, 2.55, lz); b.cone(2.1, 0.9, '#f8fafc', lx, 4.65, lz, 0, Math.PI / 4, 0, null, 4); b.box(0.8, 0.06, 3, 0.02, '#f8fafc', lx - 0.6, 1.2, lz + 2.2, -0.7, 0, 0); g2.box(1.8, 0.6, 0.05, 0.02, '#bfe6ff', lx, 3.6, lz + 1.21, 0, 0, 0, 'gloss');
    // low rope fence around court + bleachers with fans
    for (let x = -D.HW - 3; x <= D.HW + 3; x += 1.5) [-1, 1].forEach((s) => b.cyl(0.06, 0.06, 0.9, '#a16207', x, 0.45, s * (D.HL + 3.6)));
    for (let z = -D.HL - 3.6; z <= D.HL + 3.6; z += 1.5) [-1, 1].forEach((s) => b.cyl(0.06, 0.06, 0.9, '#a16207', s * (D.HW + 3), 0.45, z));
    [-1, 1].forEach((s) => { b.cyl(0.025, 0.025, D.HW * 2 + 6, '#f8fafc', 0, 0.82, s * (D.HL + 3.6), 0, 0, Math.PI / 2); b.cyl(0.025, 0.025, D.HL * 2 + 7.2, '#f8fafc', s * (D.HW + 3), 0.82, 0, Math.PI / 2, 0, 0); });
    const seats = []; bleacher(b, -(D.HW + 5.4), 0, Math.PI / 2, 3, 12, '#38bdf8', seats); bleacher(b, D.HW + 9.4, 0, -Math.PI / 2, 3, 12, '#38bdf8', seats);
    for (let i = 0; i < 14; i++) seats.push({ x: -6 + rnd() * 12, y: 0, z: D.HL + 4.5 + rnd() * 2.5, ry: Math.PI, stand: true });
    // rocks + distant island with hills and palms
    for (let i = 0; i < 10; i++) b.geo(new T.IcosahedronGeometry(0.6 + rnd() * 0.8, 1), '#a8a29e', -30 + i * 7, 0, -28 + rnd() * 3, 0, rnd(), 0, 1, 0.6, 1);
    b.sph(28, '#3fae5a', -90, -12, -220, 1.6, 0.6, 1); b.sph(18, '#56c26b', -60, -8, -215, 1.4, 0.7, 1); b.sph(30, '#6b7280', 120, -16, -260, 1.8, 0.9, 1);
    const g = new T.Group(); att(g, b, true); att(g, g2, false); rcv(g); root.add(g);
    root.userData.crowd = crowdOn(root, seats, 31, 0.6);
    root.userData.clouds = clouds(root, rnd, 7, 230, 60);
    // seagulls
    const gb = new B(); for (let i = 0; i < 6; i++) { const x = -30 + i * 12, y = 18 + rnd() * 8, z = -40 - rnd() * 20; gb.box(1.2, 0.05, 0.3, 0.02, '#ffffff', x - 0.5, y, z, 0, 0, 0.35); gb.box(1.2, 0.05, 0.3, 0.02, '#ffffff', x + 0.5, y, z, 0, 0, -0.35); }
    const gulls = new T.Group(); att(gulls, gb, false); root.add(gulls); root.userData.gulls = gulls;
    return { sun: { col: '#fff1d6', pos: [-16, 26, 10], k: 1.1 }, hemi: ['#d8f1ff', '#e6c47e', 0.62], fog: ['#ffe9c4', 100, 420], bg: '#9fd8ff' };
  };
  BUILD.roof = function (root, c, rnd) {
    skyDome(root, '#0b1033', '#3b2a7a');
    const b = new B(), g2 = new B(), W = 24, L = 34;
    // rooftop deck tiles
    for (let x = -W / 2; x < W / 2; x += 2) for (let z = -L / 2; z < L / 2; z += 2) g2.box(1.96, 0.05, 1.96, 0.01, rnd() < 0.5 ? '#4b5563' : '#525b6a', x + 1, -0.07, z + 1);
    // parapet + glass railing
    [[0, -L / 2, W, 0.5], [0, L / 2, W, 0.5]].forEach(([x, z, w, d]) => b.box(w, 1.0, d, 0.08, '#6b7280', x, 0.5, z)); [-1, 1].forEach((s) => b.box(0.5, 1.0, L, 0.08, '#6b7280', s * W / 2, 0.5, 0));
    // city skyline with lit windows (instanced)
    const winGeo = new T.BoxGeometry(0.9, 1.2, 0.1); const wins = [], bs = [];
    for (let i = 0; i < (M.low ? 50 : 90); i++) { const a = rnd() * Math.PI * 2, d = 45 + rnd() * 120, x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9 - 10; const w = 8 + rnd() * 14, h = 15 + rnd() * 70, dd = 8 + rnd() * 10; bs.push([x, z, w, h, dd]);
      b.box(w, h, dd, 0.3, ['#1e1b4b', '#1f2a44', '#27264d', '#22223a'][i % 4], x, h / 2 - 20, z, 0, Math.atan2(x, z), 0);
      if (rnd() < 0.3) { b.cyl(0.15, 0.15, 8, '#334155', x, h - 16, z); g2.sph(0.5, '#ff2d55', x, h - 12, z, 1, 1, 1, 0, 0, 0, 'glow'); }
      const ry = Math.atan2(x, z), nx = Math.sin(ry), nz = Math.cos(ry); // windows on the face toward the court
      for (let wy = -16; wy < h - 22; wy += 2.6) for (let wx = -w / 2 + 1.2; wx < w / 2 - 1; wx += 1.8) if (rnd() < 0.55) wins.push([x - nx * dd / 2 * 1.02 + Math.cos(ry) * wx, wy, z - nz * dd / 2 * 1.02 - Math.sin(ry) * wx, ry, rnd() < 0.7 ? 0 : 1]); }
    const wcols = [new T.Color('#ffd27a'), new T.Color('#9be7ff')];
    [0, 1].forEach((k) => { const list = wins.filter((w) => w[4] === k); const im = new T.InstancedMesh(winGeo, new T.MeshBasicMaterial({ color: wcols[k] }), list.length); const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
      list.forEach((w, i) => { e.set(0, w[3], 0); q.setFromEuler(e); m4.compose(new T.Vector3(w[0], w[1], w[2]), q, new T.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }); root.add(im); });
    // water tower, AC units, planters, lounge chairs
    const wx = -9, wz = -13; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c2]) => b.cyl(0.1, 0.12, 4, '#78350f', wx + a * 1.1, 2, wz + c2 * 1.1)); b.cyl(1.7, 1.7, 2.8, '#92400e', wx, 5.3, wz, 0, 0, 0, null, 18); b.cone(1.9, 1.3, '#78350f', wx, 7.35, wz, 0, 0, 0, null, 18);
    for (let i = 0; i < 4; i++) { const x = 8.5 + (i % 2) * 2.2, z = -14 + Math.floor(i / 2) * 2.4; b.box(1.8, 1.2, 1.8, 0.1, '#9ca3af', x, 0.6, z); b.tor(0.6, 0.06, '#4b5563', x, 1.22, z, Math.PI / 2, 0, 0); b.cyl(0.55, 0.55, 0.02, '#1f2937', x, 1.21, z); }
    [[-9.5, 5], [-9.5, 10], [9.5, 6], [9.5, 11], [-9.5, -3], [9.5, -3]].forEach(([x, z]) => { b.box(1.2, 0.7, 1.2, 0.1, '#e5e7eb', x, 0.35, z); bush(b, x, z, 0.9, '#22c55e'); b.sph(0.4, '#16a34a', x, 1.1, z); });
    [[7.5, 14], [9.2, 14]].forEach(([x, z]) => { b.box(0.8, 0.12, 1.8, 0.05, '#f9fafb', x, 0.35, z, -0.1); b.box(0.8, 0.7, 0.12, 0.05, '#f9fafb', x, 0.65, z - 0.9, -0.6); });
    // string lights criss-crossing over the court + poles
    const poles = [[-7, -12], [7, -12], [-7, 0], [7, 0], [-7, 12], [7, 12]]; poles.forEach(([x, z]) => b.cyl(0.07, 0.09, 5.2, '#1f2937', x, 2.6, z, 0, 0, 0, 'gloss'));
    const cols = ['#ffd27a', '#fff3c4', '#ffb86b'];
    stringLights(g2, -7, -12, 7, -12, 5.2, 0.6, 16, cols); stringLights(g2, -7, 0, 7, 0, 5.2, 0.6, 16, cols); stringLights(g2, -7, 12, 7, 12, 5.2, 0.6, 16, cols);
    stringLights(g2, -7, -12, 7, 0, 5.2, 0.8, 18, cols); stringLights(g2, 7, -12, -7, 0, 5.2, 0.8, 18, cols); stringLights(g2, -7, 0, 7, 12, 5.2, 0.8, 18, cols); stringLights(g2, 7, 0, -7, 12, 5.2, 0.8, 18, cols);
    // floodlights
    [[-8, -8], [8, 8], [-8, 8], [8, -8]].forEach(([x, z]) => { b.cyl(0.1, 0.12, 7, '#334155', x, 3.5, z); b.box(1.2, 0.5, 0.4, 0.1, '#1f2937', x, 7, z, 0, Math.atan2(-x, -z), 0); g2.box(1.0, 0.35, 0.05, 0.02, '#ffffff', x - Math.sign(x) * 0.2, 7, z - Math.sign(z) * 0.2, 0, Math.atan2(-x, -z), 0, 'glow'); });
    const seats = []; bleacher(b, -(D.HW + 4.2), 0, Math.PI / 2, 3, 12, '#a78bfa', seats); bleacher(b, D.HW + 7.2, 2, -Math.PI / 2, 3, 9, '#a78bfa', seats);
    const g = new T.Group(); att(g, b, true); att(g, g2, false); rcv(g); root.add(g);
    root.userData.crowd = crowdOn(root, seats, 41, 0.6);
    // stars + moon
    const sp = []; for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2, e = 0.08 + rnd() * 1.3, r = 500; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); root.add(new T.Points(sg, new T.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false })));
    const moon = new T.Mesh(new T.SphereGeometry(16, 24, 16), new T.MeshBasicMaterial({ color: '#fff7d6', fog: false })); moon.position.set(-120, 160, -330); root.add(moon);
    return { sun: { col: '#cdd8ff', pos: [6, 22, 10], k: 0.75 }, hemi: ['#7d86ff', '#2a2350', 0.75], fog: ['#1a1640', 70, 330], bg: '#0b1030', night: true, spots: [[-8, 7, -8], [8, 7, 8]] };
  };
  BUILD.vegas = function (root, c, rnd) {
    skyDome(root, '#0e0020', '#5b0f6b');
    ground(root, 420, ['#151021', '#1d1630'], rnd, 40);
    const b = new B(), g2 = new B();
    // glossy black plaza tiles
    for (let x = -12; x < 12; x += 2) for (let z = -17; z < 17; z += 2) g2.box(1.96, 0.04, 1.96, 0.01, (x + z) % 4 === 0 ? '#191329' : '#221a38', x + 1, -0.05, z + 1, 0, 0, 0, 'gloss');
    // neon court border
    const neon = (col) => col; [-1, 1].forEach((s) => { g2.box(D.HW * 2 + 4.4, 0.05, 0.08, 0.02, neon('#22d3ee'), 0, 0.02, s * (D.HL + 3.0), 0, 0, 0, 'glow'); g2.box(0.08, 0.05, D.HL * 2 + 6, 0.02, neon('#22d3ee'), s * (D.HW + 2.2), 0.02, 0, 0, 0, 0, 'glow'); });
    // neon tube helper (tube along polyline)
    const tube = (pts, col, r) => { const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.1); g2.geo(new T.TubeGeometry(curve, Math.max(8, pts.length * 6), r || 0.07, 6, false), col, 0, 0, 0, 0, 0, 0, 1, 1, 1, 'glow'); };
    // neon palms
    const np = (x, z, s) => { const trunk = []; for (let i = 0; i <= 6; i++) trunk.push([x + Math.sin(i * 0.25) * 0.6 * s, i * 1.0 * s, z]); tube(trunk, '#22ff88', 0.09); const top = trunk[6]; for (let f = 0; f < 6; f++) { const a = f / 6 * Math.PI * 2, fr = []; for (let k = 0; k <= 4; k++) { const t = k / 4; fr.push([top[0] + Math.cos(a) * t * 2.4 * s, top[1] + Math.sin(t * Math.PI * 0.8) * 0.8 * s - t * t * 1.4 * s, top[2] + Math.sin(a) * t * 2.4 * s]); } tube(fr, '#ff4fd8', 0.07); } b.cyl(0.4, 0.5, 0.4, '#2a2340', x, 0.2, z); };
    [[-9, -8], [9, -8], [-9, 8], [9, 8], [-10, 0], [10, 0]].forEach(([x, z]) => np(x, z, 1));
    // big neon arch + "GROK" letters + pickle sign (tube letters)
    const arch = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI; arch.push([Math.cos(a) * 7, 1 + Math.sin(a) * 6, -D.HL - 7]); } tube(arch, '#ffe14d', 0.14);
    const arch2 = arch.map((p) => [p[0] * 0.92, 1 + (p[1] - 1) * 0.92, p[2] + 0.02]); tube(arch2, '#ff4fd8', 0.09);
    [-7, 7].forEach((x) => { b.cyl(0.35, 0.45, 1.2, '#2a2340', x, 0.6, -D.HL - 7); });
    const L = { G: [[0.8, 1], [0, 1], [0, 0], [0.8, 0], [0.8, 0.5], [0.4, 0.5]], R: [[0, 0], [0, 1], [0.8, 1], [0.8, 0.5], [0, 0.5], [0.8, 0]], O: [[0, 0], [0, 1], [0.8, 1], [0.8, 0], [0, 0]], K: [[0, 1], [0, 0], [0, 0.5], [0.8, 1], [0, 0.5], [0.8, 0]] };
    const word = (wd, x0, y0, z0, s, col) => { wd.split('').forEach((ch, i) => { const pts = L[ch].map((p) => [x0 + (i * 1.15 + p[0]) * s, y0 + p[1] * s, z0]); for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], c2 = pts[k + 1]; const dx = c2[0] - a[0], dy = c2[1] - a[1], len = Math.hypot(dx, dy); g2.cyl(0.07 * s / 1.6, 0.07 * s / 1.6, len + 0.06 * s, col, (a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2, z0, 0, 0, -Math.atan2(dx, dy), 'glow', 6); g2.sph(0.08 * s / 1.6, col, a[0], a[1], z0, 1, 1, 1, 0, 0, 0, 'glow', 6, 4); } }); };
    word('GROK', -2.6, 4.2, -D.HL - 7.05, 1.4, '#3ff0ff');
    // giant dice + cards + slot machines
    const die = (x, y, z, s, ry, col) => { b.box(s, s, s, s * 0.18, col, x, y, z, 0.3, ry, 0.2, 'gloss'); for (let k = 0; k < 5; k++) b.sph(s * 0.09, '#ffffff', x + Math.cos(ry) * ((k % 2) - 0.5) * s * 0.4, y + (Math.floor(k / 2) - 1) * s * 0.28, z + s * 0.5, 1, 1, 0.4); };
    die(-12, 1.0, -12, 2, 0.4, '#ef4444'); die(12.5, 1.0, -11.5, 2, -0.6, '#ef4444'); die(-13, 0.75, 13, 1.5, 0.9, '#ffffff');
    [[11, 13, 0.4], [12.4, 12.4, -0.2]].forEach(([x, z, r]) => { b.box(1.6, 2.4, 0.06, 0.15, '#ffffff', x, 1.3, z, -0.2, r, 0); b.sph(0.3, '#ef4444', x, 1.4, z + 0.05, 1, 1, 0.2); });
    for (let i = 0; i < 6; i++) { const x = -11 + i * 4.4, z = 18; b.box(1.4, 2.2, 1.2, 0.2, '#7c3aed', x, 1.1, z); g2.box(1.0, 0.7, 0.05, 0.05, ['#3ff0ff', '#ffe14d', '#ff4fd8'][i % 3], x, 1.5, z - 0.62, 0, 0, 0, 'glow'); b.cyl(0.05, 0.05, 0.6, '#d1d5db', x + 0.8, 1.6, z, 0, 0, 0, 'gloss'); b.sph(0.12, '#ef4444', x + 0.8, 1.95, z, 1, 1, 1, 0, 0, 0, 'gloss'); g2.box(1.5, 0.12, 1.3, 0.04, '#ffe14d', x, 2.3, z, 0, 0, 0, 'glow'); }
    // casino hotel towers w/ neon bands
    for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.9 + i / 15 * Math.PI * 1.8, d = 60 + rnd() * 60, x = Math.sin(a) * d, z = -Math.cos(a) * d, h = 25 + rnd() * 60, w = 10 + rnd() * 10; b.box(w, h, w * 0.7, 0.5, ['#2b1450', '#1a1440', '#331347'][i % 3], x, h / 2 - 5, z, 0, -a, 0); for (let k = 0; k < 4; k++) g2.box(w * 1.01, 0.5, w * 0.71, 0.1, ['#ff4fd8', '#3ff0ff', '#ffe14d', '#22ff88'][(i + k) % 4], x, 4 + k * h / 4.5, z, 0, -a, 0, 'glow'); g2.box(w * 0.5, 2, 0.4, 0.1, '#ffe14d', x, h - 3, z + 0.1, 0, -a, 0, 'glow'); }
    // VIP crowd boxes + bleachers
    const seats = []; bleacher(b, -(D.HW + 4.6), 0, Math.PI / 2, 5, 18, '#ec4899', seats); bleacher(b, D.HW + 8.6, 0, -Math.PI / 2, 5, 18, '#ec4899', seats);
    // marquee bulbs along bleacher fronts
    for (let z = -9; z <= 9; z += 0.6) [-1, 1].forEach((s) => g2.sph(0.07, z * 10 % 2 ? '#fff7c2' : '#ffe14d', s * (D.HW + 4.3) + (s > 0 ? 0 : 0), 0.15, z, 1, 1, 1, 0, 0, 0, 'glow', 6, 4));
    // spotlight towers
    [[-11, -15], [11, -15], [-11, 15], [11, 15]].forEach(([x, z]) => { b.cyl(0.2, 0.3, 9, '#2a2340', x, 4.5, z); b.cyl(0.6, 0.4, 0.8, '#111827', x, 9.2, z, 0.6, 0, 0); });
    const g = new T.Group(); att(g, b, true); att(g, g2, false); rcv(g); root.add(g);
    root.userData.crowd = crowdOn(root, seats, 51, 0.55);
    // sweeping light beams (additive cones)
    const beams = []; [[-11, -15, '#ff4fd8'], [11, -15, '#3ff0ff'], [-11, 15, '#ffe14d'], [11, 15, '#22ff88']].forEach(([x, z, col], i) => { const cg = new T.ConeGeometry(2.5, 60, 16, 1, true); cg.translate(0, -30, 0); cg.rotateX(Math.PI); const m = new T.Mesh(cg, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false })); m.position.set(x, 9.4, z); m.userData.ph = i * 1.7; root.add(m); beams.push(m); });
    root.userData.beams = beams;
    const sp = []; for (let i = 0; i < 300; i++) { const a = rnd() * Math.PI * 2, e = 0.3 + rnd() * 1.2, r = 500; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); root.add(new T.Points(sg, new T.PointsMaterial({ color: '#ffd6ff', size: 1.4, sizeAttenuation: false, fog: false })));
    return { sun: { col: '#ffd6f5', pos: [5, 20, 12], k: 0.7 }, hemi: ['#b38bff', '#3a1047', 0.85], fog: ['#1a0730', 70, 320], bg: '#120022', night: true, spots: [[-7, 8, -9], [7, 8, 9]] };
  };

  C.build = function (id) {
    const c = D.court(id), root = new T.Group(), rnd = U.rng(id.length * 977 + 13);
    const env = BUILD[c.id](root, c, rnd);
    courtCore(c, root);
    root.userData.env = env; root.userData.c = c;
    return root;
  };
})();
