import { THREE, mat, mesh, box, cyl, sph, group, rbox, tube, bone, rng, canvasTexture, bake } from './kit.js';

const CHROME = () => mat('#d9dce0', { metalness: 0.9, roughness: 0.22 });
const BLACK = () => mat('#1b1c1f', { roughness: 0.55 });

/* ───────────── BUREAU ───────────── */
/* Repère local : grand axe du plateau = X, l'utilisateur est du côté +Z, surface à y = 0.74 */
export function desk() {
  const g = group();
  const top = mat('#d9c59b'), edge = mat('#e0b667'), leg = mat('#c9ccce'), foot = mat('#d6d8d9');
  g.add(rbox(1.9, 0.028, 0.8, 0.012, top, 0, 0.726, 0));
  g.add(rbox(1.92, 0.016, 0.82, 0.008, edge, 0, 0.704, 0));
  for (const s of [-1, 1]) {
    g.add(box(0.07, 0.62, 0.07, leg, s * 0.72, 0.38, 0));
    g.add(box(0.095, 0.2, 0.095, foot, s * 0.72, 0.53, 0));
    g.add(rbox(0.07, 0.035, 0.72, 0.012, foot, s * 0.72, 0.0175, 0));
    g.add(box(0.05, 0.035, 0.52, leg, s * 0.72, 0.665, 0));
  }
  g.add(box(0.1, 0.02, 0.05, mat('#26292d'), 0.55, 0.68, 0.34));
  return bake(g);
}

function screenTexture(kind, w, h) {
  return canvasTexture(w, h, (c) => {
    c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, w, h);
    const accent = '#e8452b';
    if (kind === 'wide') {
      c.fillStyle = '#e7e2d6'; c.fillRect(0, 0, w * 0.12, h);
      for (let i = 0; i < 9; i++) { c.fillStyle = i === 2 ? accent : '#bdb7a8'; c.fillRect(w * 0.02, h * (0.08 + i * 0.09), w * 0.08, h * 0.035); }
      c.fillStyle = '#ffffff'; c.fillRect(w * 0.15, h * 0.08, w * 0.4, h * 0.84);
      c.fillStyle = '#d8d2c3'; for (let i = 0; i < 12; i++) c.fillRect(w * 0.18, h * (0.14 + i * 0.065), w * (i % 4 === 3 ? 0.18 : 0.33), h * 0.022);
      c.fillStyle = accent; c.fillRect(w * 0.18, h * 0.1, w * 0.12, h * 0.03);
      c.fillStyle = '#243044'; c.fillRect(w * 0.58, h * 0.08, w * 0.4, h * 0.84);
      const cols = ['#e8452b', '#f3b43f', '#5aa97a', '#6ea0e0'];
      for (let i = 0; i < 9; i++) { c.fillStyle = cols[i % 4]; c.fillRect(w * (0.6 + (i * 0.07) % 0.22), h * (0.14 + i * 0.085), w * (0.1 + (i % 3) * 0.05), h * 0.04); }
    } else {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h * 0.09);
      c.fillStyle = accent; c.fillRect(w * 0.06, h * 0.03, w * 0.3, h * 0.03);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = '#ffffff'; c.fillRect(w * 0.05, h * (0.12 + i * 0.108), w * 0.9, h * 0.092);
        c.fillStyle = i % 3 === 0 ? accent : '#243044'; c.fillRect(w * 0.09, h * (0.135 + i * 0.108), w * 0.1, h * 0.04);
        c.fillStyle = '#cfc9ba'; c.fillRect(w * 0.23, h * (0.137 + i * 0.108), w * 0.6, h * 0.016);
        c.fillRect(w * 0.23, h * (0.165 + i * 0.108), w * 0.38, h * 0.016);
      }
    }
  });
}

export function ultrawide() {
  const g = group();
  const W = 0.84, H = 0.35, R = 0.95, th = W / R;
  const mk = (r, h, t) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 48, 1, true, Math.PI - t / 2, t);
    geo.translate(0, 0, R);
    return geo;
  };
  const shell = mesh(mk(R + 0.008, H + 0.02, th + 0.04), new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.5, side: THREE.DoubleSide }));
  const sg = mk(R - 0.004, H, th);
  const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTexture('wide', 1024, 430), side: THREE.BackSide, toneMapped: false }));
  const body = group(shell, screen);
  body.position.set(0, 0.28, 0);
  g.add(body);
  g.add(box(0.035, 0.2, 0.014, mat('#2a2c30'), 0, 0.12, -0.06));
  g.add(rbox(0.3, 0.012, 0.2, 0.005, mat('#2a2c30'), 0, 0.006, 0.0));
  return g;
}

export function portraitMonitor() {
  const g = group();
  g.add(rbox(0.34, 0.59, 0.026, 0.008, mat('#17181a', { roughness: 0.5 }), 0, 0.36, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.56), new THREE.MeshBasicMaterial({ map: screenTexture('tall', 400, 720), toneMapped: false }));
  screen.position.set(0, 0.36, 0.0135);
  g.add(screen);
  g.add(box(0.035, 0.2, 0.014, mat('#2a2c30'), 0, 0.12, -0.03));
  g.add(rbox(0.24, 0.012, 0.18, 0.005, mat('#2a2c30'), 0, 0.006, 0.0));
  return g;
}

/* ZSA Moonlander : deux moitiés indépendantes, 6 colonnes décalées × 4 rangées + rangée basse, grappe de pouce (4 touches + 2 en bas),
 * plaque noire inclinée sur pieds de tenting argentés, touches creuses à légende claire, câble TRRS entre les deux moitiés. */
export function moonlander() {
  const g = group();
  const black = mat('#17181a', { roughness: 0.5 }), silver = mat('#c4c8cd', { metalness: 0.7, roughness: 0.35 });
  const capGeo = (() => { const gg = new THREE.CylinderGeometry(0.5, 0.5, 1, 4, 1); gg.rotateY(Math.PI / 4); const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0, k = top ? 0.7 : 1; p.setX(i, p.getX(i) * Math.SQRT2 * k); p.setZ(i, p.getZ(i) * Math.SQRT2 * k); } gg.computeVertexNormals(); gg.scale(0.0185, 0.011, 0.0185); gg.translate(0, 0.0055, 0); return gg; })();
  const legend = canvasTexture(64, 64, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#17181a'; c.fillRect(24, 16, 16, 32); c.fillRect(16, 24, 32, 6); });
  const keyM = new THREE.MeshStandardMaterial({ color: '#2b2d33', roughness: 0.65 });
  const keyAlt = new THREE.MeshStandardMaterial({ color: '#3a3d45', roughness: 0.65 });
  const keyRed = new THREE.MeshStandardMaterial({ color: '#d4252d', roughness: 0.5 });
  const stag = [0.013, 0.008, 0.0, 0.006, 0.012, 0.017];
  for (const s of [-1, 1]) {
    const half = group();
    // plaque : dalle principale + pan de pouce
    half.add(rbox(0.158, 0.014, 0.205, 0.006, black, 0, 0.007, 0.0));
    half.add(rbox(0.07, 0.014, 0.09, 0.006, black, -s * 0.045, 0.007, 0.13));
    const keysA = new THREE.InstancedMesh(capGeo, keyM, 6 * 4 + 6), keysB = new THREE.InstancedMesh(capGeo, keyAlt, 16);
    keysA.castShadow = keysB.castShadow = true;
    const m4 = new THREE.Matrix4(); let na = 0, nb = 0;
    for (let c = 0; c < 6; c++) for (let r = 0; r < 4; r++) {
      const x = -s * (c - 2.5) * 0.0235, z = -0.075 + r * 0.0235 + stag[c] - 0.0;
      m4.makeTranslation(x, 0.014, z); (c === 0 || c === 5 ? keysB : keysA).setMatrixAt(c === 0 || c === 5 ? nb++ : na++, m4);
    }
    for (let c = 0; c < 4; c++) { m4.makeTranslation(-s * (c - 1.5) * 0.0235 - s * 0.012, 0.014, 0.032 + stag[Math.min(c + 1, 5)]); keysA.setMatrixAt(na++, m4); }   // rangée basse
    // grappe de pouce en éventail, côté intérieur (−s)
    const inn = -s, q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 3; i++) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s * (0.12 + i * 0.26));
      m4.compose(new THREE.Vector3(inn * (0.012 + i * 0.027), 0.014, 0.1 + i * 0.012), q, one); keysB.setMatrixAt(nb++, m4);
    }
    for (let i = 0; i < 2; i++) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s * (0.3 + i * 0.26));
      m4.compose(new THREE.Vector3(inn * (0.04 + i * 0.027), 0.014, 0.135 + i * 0.012), q, one); keysB.setMatrixAt(nb++, m4);
    }
    keysA.count = na; keysB.count = nb;
    half.add(keysA, keysB);
    // touche rouge en bout de grappe
    half.add(mesh(capGeo, keyRed, -s * 0.095, 0.014, 0.075));
    half.rotation.z = s === -1 ? 0.3 : -0.3;
    half.position.y = 0.05;
    const h = group(half);
    // pieds de tenting
    for (const z of [-0.07, 0.09]) h.add(bone([s * 0.04, 0.0, z], [-s * 0.045, 0.06, z], 0.007, 0.007, silver));
    h.add(rbox(0.12, 0.006, 0.2, 0.003, silver, s * 0.0, 0.003, 0.0));
    h.position.x = s * 0.115;
    g.add(h);
  }
  g.add(tube([[-0.04, 0.045, 0.03], [-0.01, 0.01, 0.07], [0.01, 0.01, 0.06], [0.04, 0.045, 0.03]], 0.0035, mat('#18191b'), { segs: 24, radial: 6 }));
  return g;
}

export function verticalMouse() {
  /* Evoluent VerticalMouse 4 : corps noir mat dressé à ≈ 70°, repose-pouce argenté sur le flanc, deux boutons et molette sur la crête,
   * deux boutons latéraux sur le pan du pouce, socle bas pour la paume. */
  const g = group();
  const black = mat('#1a1b1d', { roughness: 0.45 }), grip = mat('#26272b', { roughness: 0.9 }), chrome = mat('#cfd2d6', { metalness: 0.8, roughness: 0.3 }), copper = mat('#a8613a', { metalness: 0.6, roughness: 0.4 });
  const body = group();
  const shell = new THREE.SphereGeometry(1, 28, 18); shell.scale(0.03, 0.072, 0.05);
  const bm = mesh(shell, black); bm.position.set(0, 0.05, 0); body.add(bm);
  const thumb = mesh((() => { const t = new THREE.SphereGeometry(1, 20, 12); t.scale(0.012, 0.03, 0.05); return t; })(), chrome); thumb.position.set(0.03, 0.04, 0.004); thumb.rotation.z = -0.25; body.add(thumb);
  for (const z of [-0.016, 0.016]) body.add(rbox(0.012, 0.045, 0.028, 0.005, grip, 0.0, 0.1, z));                 // boutons gauche et droit
  body.add(cyl(0.006, 0.006, 0.014, copper, 0.0, 0.123, 0.0, 14).rotateX(Math.PI / 2));                         // molette
  body.add(rbox(0.01, 0.016, 0.014, 0.004, copper, 0.034, 0.075, -0.03));                                        // boutons du pouce
  body.add(rbox(0.01, 0.016, 0.014, 0.004, copper, 0.034, 0.055, -0.03));
  body.rotation.z = -0.3; body.position.set(0.0, 0.02, 0);
  g.add(body);
  g.add(rbox(0.08, 0.016, 0.13, 0.008, black, 0.0, 0.008, 0.0));
  return g;
}

/* Lampe Brontes (Cini Boeri, Artemide) : fût rouge à coupe oblique, collerette cuivrée, calotte en alu cannelée bordée d'un jonc de
 * caoutchouc ondulé, articulée sur une charnière cuivrée ; la lumière sort sous la calotte. */
export function brontes() {
  const g = group();
  const red = mat('#8f3023', { roughness: 0.35, metalness: 0.15 }), alu = mat('#cfd2d6', { metalness: 0.75, roughness: 0.38 });
  const rubber = mat('#1b1c1f', { roughness: 0.8 }), copper = mat('#c4642b', { metalness: 0.8, roughness: 0.35 });
  const body = new THREE.CylinderGeometry(0.066, 0.066, 0.36, 40, 1);
  const bp = body.attributes.position;
  for (let i = 0; i < bp.count; i++) if (bp.getY(i) > 0) bp.setY(i, bp.getY(i) + bp.getZ(i) * 0.14 - 0.005);   // coupe oblique
  body.computeVertexNormals(); body.translate(0, 0.18, 0);
  g.add(mesh(body, red));
  g.add(cyl(0.07, 0.07, 0.012, rubber, 0, 0.006, 0, 40));
  const glow = new THREE.MeshBasicMaterial({ color: '#fff0d0', toneMapped: false });
  // collerette cuivrée + charnière
  const ring = mesh(new THREE.TorusGeometry(0.066, 0.005, 6, 40), copper); ring.rotation.x = Math.PI / 2; ring.position.y = 0.36; g.add(ring);
  const lampDisc = new THREE.Mesh(new THREE.CircleGeometry(0.062, 28), glow); lampDisc.rotation.x = -Math.PI / 2; lampDisc.position.y = 0.362; g.add(lampDisc);
  g.add(box(0.05, 0.035, 0.014, copper, 0, 0.378, -0.066));
  // calotte : demi-ellipsoïde cannelé
  const shade = group();
  const dome = new THREE.SphereGeometry(1, 72, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const dp = dome.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i), th = Math.atan2(z, x), rad = Math.hypot(x, z);
    const f = 1 + 0.03 * Math.cos(th * 26) * (1 - y) * Math.min(1, rad * 4);
    dp.setXYZ(i, x * f, y, z * f);
  }
  dome.computeVertexNormals();
  const d = mesh(dome, alu); d.scale.set(0.17, 0.08, 0.105); shade.add(d);
  // jonc de caoutchouc : ellipse ondulée
  const pts = [];
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * 0.174, Math.sin(a * 2) * 0.012 + Math.sin(a * 3) * 0.006, Math.sin(a) * 0.109)); }
  const jonc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, 0.0135, 8, true), rubber); jonc.castShadow = true; shade.add(jonc);
  const underGlow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 36), glow); underGlow.rotation.x = Math.PI / 2; underGlow.scale.set(1, 0.62, 1); underGlow.position.y = 0.002; shade.add(underGlow);
  shade.position.set(0.0, 0.395, 0.07);
  shade.rotation.set(-0.45, 0.12, 0.05);
  g.add(shade);
  g.userData.glow = glow;
  g.userData.shade = shade;
  return g;
}

/* ───────────── SIÈGE SETU (Herman Miller, accoudoirs fixes, gris Mineral) ─────────────
 * Repère : avant = +z, assise à 0,46 m. Dossier en maille suivant une colonne vertébrale en S (fine en haut, nervurée en bas),
 * assise en maille à bord avant enroulé, accoudoirs en boucle blanche fixés au cadre, étoile à cinq branches, roulettes noires. */
export function officeChair() {
  const g = group();
  const frame = mat('#e7e8e6', { roughness: 0.45 }), mesh_ = new THREE.MeshStandardMaterial({ color: '#b1b4b8', roughness: 0.9, side: THREE.DoubleSide });
  const rim = mat('#8e9195', { roughness: 0.85 }), black = mat('#17181a', { roughness: 0.6 }), taupe = mat('#8f8a82', { roughness: 0.4, metalness: 0.4 });
  const base = mat('#dedfdd', { roughness: 0.5 });
  // étoile à cinq branches effilées + roulettes doubles
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = group();
    arm.add(bone([0.03, 0.12, 0], [0.33, 0.07, 0], 0.03, 0.018, base, 8));
    const cw = group(); cw.position.set(0.335, 0.045, 0);
    cw.add(cyl(0.012, 0.012, 0.04, black, 0, 0.03, 0, 8));
    for (const dz of [-0.016, 0.016]) { const w = cyl(0.03, 0.03, 0.022, black, 0, 0, dz, 14); w.rotation.x = Math.PI / 2; cw.add(w); }
    arm.add(cw); arm.rotation.y = a; g.add(arm);
  }
  g.add(cyl(0.05, 0.07, 0.07, base, 0, 0.125, 0, 16));
  g.add(cyl(0.022, 0.022, 0.16, black, 0, 0.2, 0, 12));
  g.add(cyl(0.02, 0.02, 0.16, taupe, 0, 0.32, 0, 12));
  g.add(rbox(0.3, 0.045, 0.3, 0.02, base, 0, 0.405, 0.0));
  // assise : plateau en maille, bord avant enroulé vers le bas, cadre latéral blanc
  const SW = 0.5;
  const seat = new THREE.Shape();
  seat.moveTo(-SW / 2, -0.22); seat.lineTo(SW / 2, -0.22); seat.lineTo(SW / 2, 0.2); seat.quadraticCurveTo(SW / 2, 0.24, SW / 2 - 0.05, 0.24); seat.lineTo(-SW / 2 + 0.05, 0.24); seat.quadraticCurveTo(-SW / 2, 0.24, -SW / 2, 0.2); seat.closePath();
  const seatM = mesh(new THREE.ExtrudeGeometry(seat, { depth: 0.014, bevelEnabled: false }), mesh_);
  seatM.rotation.x = Math.PI / 2; seatM.position.y = 0.46; g.add(seatM);
  g.add(tube([[-SW / 2 + 0.01, 0.455, 0.2], [-SW / 2 + 0.005, 0.455, 0.0], [-SW / 2 + 0.01, 0.46, -0.2]], 0.011, frame, { segs: 10, radial: 8 }));
  g.add(tube([[SW / 2 - 0.01, 0.455, 0.2], [SW / 2 - 0.005, 0.455, 0.0], [SW / 2 - 0.01, 0.46, -0.2]], 0.011, frame, { segs: 10, radial: 8 }));
  g.add(tube([[-SW / 2 + 0.03, 0.46, 0.235], [0, 0.462, 0.245], [SW / 2 - 0.03, 0.46, 0.235]], 0.016, rim, { segs: 12, radial: 8 }));      // bord enroulé
  g.add(tube([[-SW / 2 + 0.03, 0.456, 0.235], [-SW / 2 + 0.012, 0.43, 0.235]], 0.01, rim, { segs: 4, radial: 6, caps: false }));
  g.add(tube([[SW / 2 - 0.03, 0.456, 0.235], [SW / 2 - 0.012, 0.43, 0.235]], 0.01, rim, { segs: 4, radial: 6, caps: false }));
  // dossier : profil en S, du fond d'assise vers le haut incliné
  const prof = [[0.46, -0.215], [0.5, -0.255], [0.56, -0.265], [0.64, -0.245], [0.73, -0.265], [0.82, -0.295], [0.9, -0.325], [0.955, -0.345]];
  const curve = new THREE.CatmullRomCurve3(prof.map(([y, z]) => new THREE.Vector3(0, y, z)), false, 'centripetal');
  const N = 28, BW = 0.4, pos = [], idx = [], uv = [];
  for (let i = 0; i <= N; i++) {
    const p = curve.getPoint(i / N), w = BW / 2 * (0.88 + 0.12 * Math.min(1, i / (N * 0.45)));
    for (const sx of [-1, 1]) { pos.push(sx * w, p.y, p.z); uv.push(sx < 0 ? 0 : 1, i / N); }
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); bg.computeVertexNormals();
  g.add(mesh(bg, mesh_));
  const offs = (dx, dz = 0) => prof.map(([y, z]) => [dx, y, z + dz]);
  for (const sx of [-1, 1]) g.add(tube(offs(sx * (BW / 2 + 0.014)), 0.014, frame, { segs: 60, radial: 10 }));
  g.add(tube([[-BW / 2 - 0.014, 0.955, -0.345], [0, 0.97, -0.352], [BW / 2 + 0.014, 0.955, -0.345]], 0.017, rim, { segs: 24, radial: 10 }));           // jonc supérieur
  // colonne vertébrale nervurée (bas du dossier) : côtes blanches de chaque côté
  for (let i = 0; i < 8; i++) {
    const p = curve.getPoint(0.03 + i * 0.05);
    for (const sx of [-1, 1]) g.add(rbox(0.032, 0.012, 0.03, 0.004, frame, sx * (BW / 2 + 0.02), p.y, p.z - 0.012));
  }
  g.add(tube([[0, 0.43, -0.12], [0, 0.46, -0.2], [0, 0.49, -0.25]], 0.014, frame, { segs: 8, radial: 8 }));
  g.add(box(0.46, 0.012, 0.03, frame, 0, 0.445, -0.2));
  // accoudoirs fixes en boucle blanche
  for (const sx of [-1, 1]) {
    const x = sx * (SW / 2 + 0.012);
    g.add(tube([[x, 0.47, -0.2], [x, 0.56, -0.18], [x + sx * 0.012, 0.64, -0.1], [x + sx * 0.012, 0.665, 0.0], [x + sx * 0.012, 0.65, 0.1], [x, 0.58, 0.145], [x, 0.5, 0.12], [x, 0.46, 0.06]], 0.0125, frame, { segs: 80, radial: 10, caps: false }));
    g.add(rbox(0.04, 0.012, 0.2, 0.005, frame, x + sx * 0.012, 0.67, 0.0));
  }
  const pivot = g;
  g.userData.pivot = pivot;
  return bake(g);
}

/* ───────────── PLANTES ───────────── */
function bowl(R, H, color, gravel = '#e5e0d3') {
  const g = group();
  const pts = [];
  for (let i = 0; i <= 14; i++) { const p = (i / 14) * Math.PI / 2; pts.push(new THREE.Vector2(R * Math.sin(p), H * (1 - Math.cos(p)))); }
  pts.push(new THREE.Vector2(R * 0.93, H * 1.0));
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide });
  g.add(mesh(new THREE.LatheGeometry(pts, 40), m));
  g.add(cyl(R * 0.95, R * 0.95, 0.004, mat(gravel, { roughness: 1 }), 0, H * 0.96, 0, 40));
  return bake(g);
}

export function bonsai() {
  /* Bonsaï à tronc renflé gris, branches brunes noueuses, petites feuilles pennées clairsemées, vasque de béton brut. */
  const r = rng(11);
  const g = group();
  g.add(bowl(0.17, 0.12, '#9b9a92', '#bfb398'));
  const trunk = mat('#8d898b', { roughness: 0.9 }), twig = mat('#6e5a50', { roughness: 0.9 });
  const tips = [];
  const grow = (p, dir, len, rad, depth) => {
    const q = [p[0] + dir.x * len, p[1] + dir.y * len, p[2] + dir.z * len];
    const m = depth >= 2 ? trunk : twig;
    g.add(bone(p, q, rad, rad * 0.78, m, 7));
    g.add(sph(rad * 0.95, m, q[0], q[1], q[2], 9, 7));
    if (depth === 0) { tips.push(q); return; }
    const kids = depth >= 3 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      const a = (i / kids) * Math.PI * 2 + r() * 1.3;
      const d = dir.clone().multiplyScalar(0.35).add(new THREE.Vector3(Math.cos(a) * 1.0, 0.12 + r() * 0.5, Math.sin(a) * 1.0)).normalize();
      grow(q, d, len * (0.8 + r() * 0.2), rad * 0.66, depth - 1);
    }
    if (depth <= 2) tips.push(q);
  };
  // tronc renflé, noueux
  for (const [y, rr] of [[0.125, 0.04], [0.15, 0.046], [0.18, 0.04]]) g.add(sph(rr, trunk, (y - 0.12) * 0.1, y, 0, 12, 9));
  g.add(bone([0, 0.1, 0], [0.005, 0.2, 0], 0.044, 0.036, trunk, 10));
  grow([0.005, 0.2, 0], new THREE.Vector3(0.05, 1, 0).normalize(), 0.085, 0.034, 4);
  const leafGeo = new THREE.SphereGeometry(1, 5, 3);
  const per = 4, count = tips.length * per;
  const leaves = new THREE.InstancedMesh(leafGeo, mat('#ffffff', { roughness: 0.8 }), count);
  leaves.castShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const greens = ['#93c476', '#7fb164', '#a6cf86', '#6fa257'];
  let n = 0;
  for (const t of tips) for (let i = 0; i < per; i++) {
    v.set(t[0] + (r() - 0.5) * 0.08, t[1] + (r() - 0.25) * 0.045, t[2] + (r() - 0.5) * 0.08);
    e.set((r() - 0.5) * 1.2, r() * 6.3, (r() - 0.5) * 1.2); q.setFromEuler(e);
    sc.set(0.03 + r() * 0.01, 0.0045, 0.0085 + r() * 0.003);
    m4.compose(v, q, sc); leaves.setMatrixAt(n, m4);
    leaves.setColorAt(n, new THREE.Color(greens[(r() * 4) | 0])); n++;
  }
  g.add(leaves);
  return bake(g);
}

export function dracaena() {
  /* Dragonnier multi-troncs : vasque de béton large et basse, gravier blanc, pierre, tiges nues sinueuses couronnées de rosettes. */
  const r = rng(5);
  const g = group();
  g.add(bowl(0.42, 0.17, '#b3a893', '#ece8de'));
  g.add(mesh(new THREE.DodecahedronGeometry(0.07, 0), mat('#9d9a92', { roughness: 1 }), 0.16, 0.17, 0.12));
  const stemM = mat('#a58a66', { roughness: 0.9 }), leafM = [mat('#4f9a3a'), mat('#3f8a30'), mat('#62a845')];
  const blade = new THREE.ConeGeometry(0.0085, 0.32, 4); blade.translate(0, 0.16, 0);
  const rosette = (p, nb, scale) => {
    const ros = group();
    for (let b = 0; b < nb; b++) {
      const bl = mesh(blade, leafM[b % 3]);
      bl.scale.set(1, (0.7 + r() * 0.5) * scale, 1);
      const wrap = group(bl); wrap.rotation.set(0, (b / nb) * Math.PI * 2 + r() * 0.3, 0);
      const tilt = group(wrap); tilt.rotation.z = 0.25 + r() * 1.15;
      const yaw = group(tilt); yaw.rotation.y = (b / nb) * Math.PI * 2 + r() * 0.4;
      wrap.rotation.set(0, 0, 0);
      ros.add(yaw);
    }
    ros.position.copy(p); g.add(ros);
  };
  // racines noueuses à la base
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.4, len = 0.12 + r() * 0.1;
    g.add(bone([Math.cos(a) * 0.03, 0.2, Math.sin(a) * 0.03], [Math.cos(a) * len, 0.17, Math.sin(a) * len], 0.032, 0.02, stemM, 7));
  }
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.5;
    const top = 0.9 + r() * 1.15;
    const drift = 0.2 + r() * 0.45;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push(new THREE.Vector3(
        Math.cos(a) * drift * t * t + Math.sin(t * 5.2 + i * 1.7) * 0.07 * t,
        0.2 + t * top,
        Math.sin(a) * drift * t * t + Math.cos(t * 4.6 + i * 2.3) * 0.07 * t));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const P = curve.getPoints(22);
    for (let k = 0; k < P.length - 1; k++) {
      const rad = 0.021 - 0.011 * (k / P.length);
      g.add(bone([P[k].x, P[k].y, P[k].z], [P[k + 1].x, P[k + 1].y, P[k + 1].z], rad, rad * 0.96, stemM, 6));
    }
    rosette(P[P.length - 1], 13, 1);
    if (r() > 0.45) rosette(P[Math.floor(P.length * (0.55 + r() * 0.2))], 9, 0.75);     // rosette latérale
  }
  return bake(g);
}

/* ───────────── TAPIS PERSAN ───────────── */
export function rug(tex, w = 1.6, l = 2.25) {
  const g = group();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 1, side: THREE.DoubleSide }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.018; top.receiveShadow = true;
  const under = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.995, l * 0.995), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, color: '#4a2a22', roughness: 1, side: THREE.DoubleSide }));
  under.rotation.x = -Math.PI / 2; under.position.y = 0.006; under.receiveShadow = true;
  const mid = under.clone(); mid.position.y = 0.012;
  g.add(under, mid, top);
  g.rotation.y = 0;
  const out = group(g);
  return out;
}

/* ───────────── FAUTEUIL EKSTREM ───────────── */
export function ekstrem() {
  /* Ekstrem (Terje Ekstrøm), mesuré sur les photos de face, de profil et de trois quarts (H 0,84 · L 0,80 · P 0,76 m) :
   *  - par côté, un poteau arrière rond qui monte jusqu'au « M », se recourbe vers le centre et rejoint le dossier,
   *  - une poutre matelassée par côté (jointes par une couture au centre) : dossier incliné, assise arrière haute, marche arrondie,
   *    assise avant basse avec sa cuvette ; section rectangulaire à angles très arrondis, balayée le long du profil en S,
   *  - l'avant : jambe ronde et barre en arche qui revient vers le centre,
   *  - pieds avec embouts gris. */
  const g = group();
  const weave = canvasTexture(64, 64, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { c.fillStyle = (x / 4 + y / 4) % 2 ? '#b5b5b5' : '#5a5a5a'; c.fillRect(x, y, 3, 3); } });
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(10, 10); weave.colorSpace = THREE.NoColorSpace;
  const fabric = new THREE.MeshStandardMaterial({ color: '#25272d', roughness: 1, bumpMap: weave, bumpScale: 1.4 });
  const pad = new THREE.MeshStandardMaterial({ color: '#2d2f36', roughness: 1, bumpMap: weave, bumpScale: 1.4 });
  const R = 0.058, X0 = 0.34, ZF = 0.64, zc = -0.32;
  const T = (pts, r = R) => g.add(tube(pts, r, fabric, { segs: 72, radial: 12 }));
  // profil de la poutre matelassée dans le plan (y, z) : section 0,23 (largeur) × 0,105 (épaisseur)
  const profile = [[0.79, 0.06], [0.74, 0.085], [0.66, 0.12], [0.61, 0.17], [0.59, 0.24], [0.585, 0.36], [0.57, 0.42], [0.52, 0.455], [0.46, 0.48], [0.435, 0.52], [0.43, 0.6], [0.43, 0.66]];
  const sweep = (xb) => {
    const curve = new THREE.CatmullRomCurve3(profile.map(([y, z]) => new THREE.Vector3(xb, y, zc + z)), false, 'centripetal');
    const w = 0.23, t = 0.105, r = 0.05, sh = new THREE.Shape();
    const hx = w / 2, hy = t / 2;          // x = normale de Frenet (largeur, le long de x), y = binormale (épaisseur, dans le plan du profil)
    sh.moveTo(-hx + r, -hy); sh.lineTo(hx - r, -hy); sh.absarc(hx - r, -hy + r, r, -Math.PI / 2, 0); sh.lineTo(hx, hy - r); sh.absarc(hx - r, hy - r, r, 0, Math.PI / 2);
    sh.lineTo(-hx + r, hy); sh.absarc(-hx + r, hy - r, r, Math.PI / 2, Math.PI); sh.lineTo(-hx, -hy + r); sh.absarc(-hx + r, -hy + r, r, Math.PI, Math.PI * 1.5);
    return mesh(new THREE.ExtrudeGeometry(sh, { extrudePath: curve, steps: 90, bevelEnabled: false, curveSegments: 3 }), pad);
  };
  for (const s of [-1, 1]) {
    const x0 = s * X0, xb = s * 0.125;
    // poteau arrière + bosse du « M » : il redescend vers le centre et se fond dans le dossier
    T([[x0, 0.02, zc], [x0, 0.5, zc], [x0, 0.73, zc], [x0 - s * 0.01, 0.8, zc + 0.01], [x0 - s * 0.06, 0.835, zc + 0.03], [x0 - s * 0.14, 0.81, zc + 0.06], [x0 - s * 0.2, 0.76, zc + 0.075], [xb + s * 0.02, 0.76, zc + 0.075]]);
    g.add(sweep(xb));
    g.add(cyl(0.048, 0.048, 0.006, mat('#1a1b20', { roughness: 1 }), xb, 0.4835, zc + 0.6, 24));          // cuvette d'assise
    // avant : arche qui revient vers le centre, jambe ronde
    T([[s * 0.005, 0.43, zc + ZF], [s * 0.2, 0.43, zc + ZF], [x0 - s * 0.03, 0.42, zc + ZF], [x0, 0.35, zc + ZF], [x0, 0.02, zc + ZF]]);
    for (const z of [zc, zc + ZF]) g.add(cyl(R * 0.92, R, 0.035, mat('#4a4c52', { roughness: 0.55 }), x0, 0.0175, z, 22));
  }
  return bake(g);
}

/* ───────────── LAMPADAIRE EN ARC ───────────── */
export function arcLamp() {
  /* Lampadaire en arc sur socle de marbre blanc veiné (bloc 0,26 × 0,2 × 0,38 m) ; deux tiges chromées parallèles, tête rectangulaire émettrice. */
  const g = group();
  const chrome = mat('#b4b8be', { metalness: 0.9, roughness: 0.28 }), black = mat('#16171a', { roughness: 0.4 });
  const marbleTex = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#efede8'; c.fillRect(0, 0, w, h);
    const r = rng(12);
    c.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = `rgba(${r() > 0.5 ? '120,124,132' : '160,160,166'},${0.25 + r() * 0.35})`; c.lineWidth = 0.6 + r() * 2;
      c.beginPath(); let x = r() * w, y = 0; c.moveTo(x, y);
      while (y < h) { x += (r() - 0.5) * 36; y += 14 + r() * 18; c.lineTo(x, y); }
      c.stroke();
    }
  });
  const marble = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.25, metalness: 0.05, emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: marbleTex });
  g.add(rbox(0.26, 0.2, 0.38, 0.012, marble, 0, 0.1, 0));
  g.add(cyl(0.02, 0.022, 0.012, black, 0, 0.206, 0, 14));
  const path = [[0, 0.2, 0], [0, 1.1, 0], [0.04, 1.75, 0], [0.3, 2.1, 0], [0.8, 2.22, 0], [1.3, 2.2, 0]];
  for (const dz of [-0.016, 0.016]) g.add(tube(path.map((p) => [p[0], p[1], p[2] + dz]), 0.011, chrome, { segs: 70, radial: 10 }));
  const head = group();
  head.add(rbox(0.3, 0.025, 0.16, 0.012, black, 0, 0, 0));
  const glow = new THREE.MeshBasicMaterial({ color: '#ffe6b0', toneMapped: false });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.12), glow); f.rotation.x = Math.PI / 2; f.position.y = -0.0135; head.add(f);
  head.position.set(1.38, 2.2, 0);
  g.add(head);
  g.userData.glow = glow;
  g.userData.headPos = new THREE.Vector3(1.38, 2.18, 0);
  return bake(g);
}

/* ───────────── TABLEAU ───────────── */
export function painting(tex) {
  /* Tableau simplement suspendu : le volume s'arrête au bord extérieur du cadre. */
  const g = group();
  const side = mat('#3b2616', { roughness: 0.7 });
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const m = mesh(new THREE.BoxGeometry(0.56, 0.642, 0.03), [side, side, side, side, front, side]);
  m.position.set(0, 0, 0);
  g.add(m);
  return g;
}

/* ───────────── USM HALLER (vert) + platine + lampe béton ───────────── */
export function usm() {
  const g = group();
  const chrome = CHROME(), green = mat('#43a12d', { roughness: 0.28, metalness: 0.2 });
  const Y0 = 0.03, W = 1.5, H = 0.7, D = 0.35;
  const xs = [-W / 2, 0, W / 2], ys = [0, H / 2, H], zs = [-D / 2, D / 2];
  const tr = 0.0095;
  for (const y of ys) for (const z of zs) { const t = cyl(tr, tr, W, chrome, 0, Y0 + y, z, 10); t.rotation.z = Math.PI / 2; g.add(t); }
  for (const x of xs) for (const z of zs) g.add(cyl(tr, tr, H, chrome, x, Y0 + H / 2, z, 10));
  for (const x of xs) for (const y of ys) { const t = cyl(tr, tr, D, chrome, x, Y0 + y, 0, 10); t.rotation.x = Math.PI / 2; g.add(t); }
  for (const x of xs) for (const y of ys) for (const z of zs) g.add(sph(0.0125, chrome, x, Y0 + y, z, 14, 10));
  for (const x of xs) for (const z of zs) g.add(cyl(0.012, 0.016, 0.03, mat('#17181a'), x, 0.015, z, 12));
  const P = 0.008, ins = 0.011;
  g.add(box(W - 0.02, P, D - 0.02, green, 0, Y0 + H + 0.0, 0));
  g.add(box(W - 0.02, P, D - 0.02, green, 0, Y0 + H / 2, 0));
  g.add(box(W - 0.02, P, D - 0.02, green, 0, Y0, 0));
  g.add(box(W - 0.02, H - 0.02, P, green, 0, Y0 + H / 2, -D / 2 + 0.004));
  for (const x of xs) g.add(box(P, H - 0.02, D - 0.02, green, x, Y0 + H / 2, 0));
  const doors = [];
  for (const cx of [-W / 4, W / 4]) for (const row of [0, 1]) {
    const y = Y0 + H / 4 + row * H / 2;
    const door = group(box(W / 2 - 0.022, H / 2 - 0.022, 0.012, green, 0, 0, 0));
    const knob = cyl(0.011, 0.011, 0.016, chrome, 0, row === 0 ? 0.11 : -0.11, 0.012, 16); knob.rotation.x = Math.PI / 2;
    door.add(knob);
    door.position.set(cx, y, D / 2 + 0.001);
    g.add(door); doors.push(door);
  }
  g.userData.top = Y0 + H + P / 2;
  return bake(g);
}

export function turntable() {
  const g = group();
  const wood = mat('#3f2d22', { roughness: 0.6 }), alu = mat('#c4c7cb', { metalness: 0.75, roughness: 0.3 });
  g.add(rbox(0.44, 0.05, 0.34, 0.01, wood, 0, 0.025, 0));
  g.add(cyl(0.15, 0.15, 0.018, alu, -0.04, 0.059, 0.0, 48));
  const rec = group();
  rec.add(cyl(0.144, 0.144, 0.004, mat('#0e0e10', { roughness: 0.3 }), 0, 0, 0, 56));
  rec.add(cyl(0.05, 0.05, 0.0055, mat('#e8452b'), 0, 0, 0, 28));
  for (const rr of [0.09, 0.115, 0.13]) { const ring = mesh(new THREE.TorusGeometry(rr, 0.0012, 4, 60), mat('#26262a', { roughness: 0.2 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.002; rec.add(ring); }
  rec.position.set(-0.04, 0.071, 0);
  g.add(rec);
  g.add(cyl(0.02, 0.022, 0.03, alu, 0.17, 0.065, -0.1, 18));
  const arm = group(bone([0, 0, 0], [-0.04, 0, 0.22], 0.0045, 0.0045, alu), box(0.022, 0.006, 0.03, mat('#17181a'), -0.043, 0, 0.235));
  arm.position.set(0.17, 0.085, -0.1);
  arm.rotation.y = 0.22;
  g.add(arm);
  g.userData.record = rec; g.userData.arm = arm;
  return g;
}

export function concreteLamp() {
  /* Lampe Béton (Le Corbusier, Chandigarh) : profil en équerre moulé d'un bloc — socle plat, concavité qui remonte,
   * paroi arrière, capot cylindrique en surplomb avec la fente lumineuse dessous. Extérieur gris, intérieur crème. */
  const g = group();
  const W = 0.46;
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.4, 0); s.lineTo(0.4, 0.045);
  s.bezierCurveTo(0.22, 0.05, 0.1, 0.1, 0.1, 0.24);
  s.lineTo(0.1, 0.285); s.lineTo(0.3, 0.295);
  s.absarc(0.3, 0.3475, 0.0525, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(0.075, 0.4);
  s.quadraticCurveTo(0, 0.4, 0, 0.33);
  s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 28 });
  geo.translate(-0.2, 0, -W / 2);
  geo.rotateY(-Math.PI / 2);                              // profil : avant = +z, largeur = x
  const pos = geo.attributes.position, nor = geo.attributes.normal, col = new Float32Array(pos.count * 3);
  const gray = new THREE.Color('#a9a6a0'), cream = new THREE.Color('#e9d6b6');
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), z = pos.getZ(i) + 0.2, nz = nor.getZ(i), ny = nor.getY(i);
    const inner = (z > 0.09 && y < 0.3 && (nz > 0.15 || ny > 0.6)) || (ny < -0.6 && y > 0.27 && y < 0.31);
    (inner ? cream : gray).toArray(col, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const bump = canvasTexture(128, 128, (c, w, h) => {
    const id = c.createImageData(w, h);
    for (let i = 0; i < id.data.length; i += 4) { const v = 120 + Math.random() * 100; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    c.putImageData(id, 0, 0);
  });
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, bumpMap: bump, bumpScale: 0.6 });
  const body = mesh(geo, m);
  const glowM = new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false });
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.17), glowM);
  slot.rotation.x = Math.PI / 2; slot.position.set(0, 0.288, 0.2 - 0.2 + 0.0);
  slot.position.z = 0.0;
  g.add(body, slot);
  slot.position.set(0, 0.2885, -0.2 + 0.2);
  g.userData.glow = glowM;
  return g;
}

/* ───────────── ENCEINTE JBL L52 Classic sur pied ─────────────
 * Ébénisterie noyer (0,32 × 0,20 × 0,21 m), baffle noir granuleux, tweeter à dôme en haut, évent rond à côté, boomer de 5,25″ à cône crème
 * et bobine noire, quatre vis rondes aux angles, plaque JBL orange avec bouton de réglage. `flip` inverse la disposition (paire gauche/droite). */
export function speaker(flip = false, onStand = true) {
  const g = group();
  const grain = canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#6b4128'; c.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(${r() > 0.5 ? '40,22,12' : '120,76,46'},${0.18 + r() * 0.25})`; c.fillRect(0, r() * h, w, 1 + r() * 3); }
  });
  const walnut = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.5 });
  const baffle = new THREE.MeshStandardMaterial({ map: canvasTexture(64, 64, (c, w, h) => { c.fillStyle = '#121214'; c.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 260; i++) { c.fillStyle = r() > 0.5 ? '#1d1d20' : '#0a0a0b'; c.fillRect(r() * w, r() * h, 1, 1); } }), roughness: 0.95 });
  const black = mat('#0c0c0e', { roughness: 0.6 });
  const W = 0.2, H = 0.32, D = 0.21;
  // stand
  const stand = group();
  const steel = mat('#1b1c1f', { roughness: 0.4, metalness: 0.5 });
  stand.add(rbox(0.27, 0.014, 0.27, 0.006, steel, 0, 0.007, 0));
  for (const x of [-0.07, 0.07]) stand.add(cyl(0.011, 0.011, 0.56, steel, x, 0.3, 0, 10));
  stand.add(rbox(0.24, 0.012, 0.24, 0.005, steel, 0, 0.586, 0));
  if (onStand) g.add(stand);
  const cab = group(); cab.position.y = onStand ? 0.592 : 0.0;
  cab.add(rbox(W, H, D, 0.008, walnut, 0, H / 2, 0));
  cab.add(rbox(W - 0.006, H - 0.006, 0.012, 0.004, baffle, 0, H / 2, D / 2 + 0.002));
  const f = D / 2 + 0.01, sx = flip ? -1 : 1;
  // boomer
  const wy = 0.105;
  const ring = mesh(new THREE.TorusGeometry(0.058, 0.007, 8, 40), black); ring.position.set(0, wy, f); cab.add(ring);
  const cone = mesh(new THREE.CylinderGeometry(0.052, 0.022, 0.026, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#d9d0a6', roughness: 0.7, side: THREE.DoubleSide }));
  cone.rotation.x = Math.PI / 2; cone.position.set(0, wy, f - 0.006); cab.add(cone);
  for (let i = 0; i < 4; i++) { const rr = mesh(new THREE.TorusGeometry(0.04 - i * 0.008, 0.0014, 4, 32), mat('#bfb68c')); rr.position.set(0, wy, f - 0.004 + i * 0.002); cab.add(rr); }
  const cap = sph(0.026, mat('#0f0f11', { roughness: 0.4 }), 0, wy, f - 0.004, 18, 12); cap.scale.z = 0.7; cab.add(cap);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; cab.add(cyl(0.0035, 0.0035, 0.003, black, Math.cos(a) * 0.066, wy + Math.sin(a) * 0.066, f + 0.002, 8).rotateX(Math.PI / 2)); }
  // tweeter
  const ty = 0.255, tx = -sx * 0.045;
  const tr = mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 28), black); tr.position.set(tx, ty, f); cab.add(tr);
  const tcone = mesh(new THREE.CylinderGeometry(0.03, 0.012, 0.018, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.5, side: THREE.DoubleSide })); tcone.rotation.x = Math.PI / 2; tcone.position.set(tx, ty, f - 0.004); cab.add(tcone);
  cab.add(sph(0.012, mat('#2c2c30', { metalness: 0.6, roughness: 0.35 }), tx, ty, f - 0.003, 14, 10));
  // évent
  const px = sx * 0.045;
  const port = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.8, side: THREE.DoubleSide })); port.rotation.x = Math.PI / 2; port.position.set(px, ty, f - 0.02); cab.add(port);
  cab.add(mesh(new THREE.TorusGeometry(0.027, 0.004, 6, 24), black, px, ty, f));
  // plaque JBL + bouton
  cab.add(box(0.07, 0.022, 0.003, mat('#161618'), 0, 0.305, f + 0.001));
  cab.add(box(0.016, 0.009, 0.0032, mat('#e8601a', { roughness: 0.5 }), -0.022, 0.31, f + 0.0015));
  cab.add(cyl(0.007, 0.007, 0.01, black, 0.018, 0.307, f + 0.004, 12).rotateX(Math.PI / 2));
  // vis aux angles
  for (const [x, y] of [[-0.088, 0.02], [0.088, 0.02], [-0.088, 0.3], [0.088, 0.3]]) cab.add(sph(0.0065, black, x, y, f + 0.003, 8, 6));
  g.add(cab);
  g.rotation.y = 0;
  return bake(g);
}

/* ───────────── TABOURET JAPONAIS ───────────── */
export function stool() {
  const g = group();
  const wood = mat('#b98c5b', { roughness: 0.95 }), dark = mat('#8c6439', { roughness: 1 });
  const top = cyl(0.19, 0.2, 0.05, wood, 0, 0.345, 0, 28); top.scale.set(1, 1, 0.92); g.add(top);
  const ring = mesh(new THREE.TorusGeometry(0.192, 0.006, 5, 40), dark); ring.rotation.x = Math.PI / 2; ring.position.y = 0.37; ring.scale.set(1, 0.92, 1); g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const b = bone([Math.cos(a) * 0.12, 0.33, Math.sin(a) * 0.11], [Math.cos(a) * 0.19, 0.0, Math.sin(a) * 0.17], 0.026, 0.032, i === 1 ? dark : wood, 8);
    g.add(b);
  }
  g.add(bone([Math.cos(0.5) * 0.16, 0.12, Math.sin(0.5) * 0.14], [Math.cos(0.5 + 2.09) * 0.16, 0.12, Math.sin(0.5 + 2.09) * 0.14], 0.012, 0.012, dark, 6));
  return bake(g);
}

/* ───────────── BANC BAS EN BOIS ───────────── */
export function bench() {
  const g = group();
  const wood = mat('#bf9462', { roughness: 0.9 });
  g.add(rbox(0.6, 0.04, 0.28, 0.012, wood, 0, 0.26, 0));
  for (const x of [-0.25, 0.25]) for (const z of [-0.1, 0.1]) g.add(box(0.04, 0.24, 0.04, wood, x, 0.12, z));
  return bake(g);
}

/* ───────────── ÉTAGÈRE MODULAIRE « Omni » (Giotto Stoppino, Kartell) : plastique crème, montants à coins arrondis ───────────── */
export function shelf() {
  const g = group();
  const cream = new THREE.MeshStandardMaterial({ color: '#f2ecdb', roughness: 0.5, emissive: '#3a362c', emissiveIntensity: 0.35 });
  const W = 1.66, H = 1.5, D = 0.36, T = 0.04;
  const X = [-W / 2 + T / 2, 0, W / 2 - T / 2];
  // montants (dépassent en haut de la dernière tablette)
  for (const x of X) g.add(rbox(T, H, D, 0.016, cream, x, H / 2, 0));
  // tablettes (hauteur depuis le sol) par travée : [travée gauche, travée droite]
  const bays = [[-W / 4 + 0.005, W / 2 - T - 0.0], [W / 4 - 0.005, 0]];
  const L = (W - 3 * T) / 2;
  const left = [1.285, 1.05, 0.817, 0.257], right = [1.285, 1.07, 0.55];
  for (const y of left) g.add(rbox(L, 0.036, D, 0.014, cream, -(L / 2 + T / 2), y, 0));
  for (const y of right) g.add(rbox(L, 0.036, D, 0.014, cream, (L / 2 + T / 2), y, 0));
  // objets
  const bx = (L / 2 + T / 2);
  const cols = ['#4f86b8', '#ececec', '#6aa86a', '#d9d4c4'];
  for (let i = 0; i < 4; i++) g.add(cyl(0.03, 0.028, 0.08, mat(cols[i], { roughness: 0.4 }), -bx - 0.26 + i * 0.075, 1.05 + 0.058, 0.0, 14));
  g.add(cyl(0.032, 0.03, 0.07, mat('#8fbf8a'), bx + 0.28, 1.07 + 0.053, 0.05, 14));
  const bag = canvasTexture(64, 64, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#e8e6e0' : '#2a2a2c'; c.fillRect(x * 8, y * 8, 8, 8); } });
  g.add(rbox(0.28, 0.14, 0.12, 0.03, new THREE.MeshStandardMaterial({ map: bag, roughness: 0.8 }), bx - 0.02, 1.07 + 0.088, 0.02));
  g.add(cyl(0.12, 0.12, 0.004, mat('#ece8dc'), -bx + 0.1, 0.817 + 0.022, 0.0, 24));
  const books = ['#d9d4c4', '#2c2c30', '#e8e6dc', '#c9402e'];
  for (let i = 0; i < 4; i++) g.add(box(0.28 - i * 0.015, 0.03, 0.2, mat(books[i], { roughness: 0.8 }), -bx + 0.12 + (i % 2) * 0.01, 0.257 + 0.033 + i * 0.03, 0.0));
  const kettle = group(sph(0.07, mat('#c9ccd0', { metalness: 0.8, roughness: 0.3 }), 0, 0.06, 0, 18, 12), cyl(0.012, 0.03, 0.05, mat('#c9ccd0', { metalness: 0.8, roughness: 0.3 }), 0, 0.14, 0, 12), sph(0.014, mat('#c9402e'), 0, 0.17, 0, 8, 6));
  kettle.add(mesh(new THREE.TorusGeometry(0.06, 0.007, 6, 18, Math.PI), mat('#1b1c1f'), 0, 0.14, 0).rotateZ(0));
  kettle.position.set(bx - 0.15, 0.55 + 0.018, 0.0); g.add(kettle);
  const vase = group(cyl(0.05, 0.06, 0.13, mat('#cfc9bd', { roughness: 0.6 }), 0, 0.065, 0, 18), cyl(0.04, 0.04, 0.05, mat('#bdb7aa', { roughness: 0.6 }), 0, 0.155, 0, 18), sph(0.012, mat('#bdb7aa'), 0, 0.19, 0, 8, 6));
  vase.position.set(bx + 0.18, 0.55 + 0.018, -0.02); g.add(vase);
  g.userData.top = H;
  return bake(g);
}
