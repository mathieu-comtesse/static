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

/* ZSA Moonlander : deux moitiés inclinées sur plaque, pouce rouge */
export function moonlander() {
  const g = group();
  const black = mat('#18191b', { roughness: 0.5 }), keyM = mat('#2b2c30', { roughness: 0.6 }), red = mat('#e0212a', { roughness: 0.4 });
  const silver = mat('#c9ccd0', { metalness: 0.7, roughness: 0.35 });
  const keyGeo = new THREE.BoxGeometry(0.0185, 0.013, 0.0185);
  const stag = [0.014, 0.01, 0.0, 0.006, 0.012, 0.018];
  const halves = [];
  for (const s of [-1, 1]) {
    const half = group();
    half.add(rbox(0.17, 0.02, 0.22, 0.008, black, 0, 0.0, 0.01));
    const keys = new THREE.InstancedMesh(keyGeo, keyM, 5 * 6 + 3);
    keys.castShadow = true;
    let n = 0; const m4 = new THREE.Matrix4();
    for (let c = 0; c < 6; c++) for (let r = 0; r < 5; r++) {
      m4.makeTranslation(-s * (c - 2.5) * 0.0235 + 0, 0.015, -0.08 + r * 0.0235 + stag[c]);
      keys.setMatrixAt(n++, m4);
    }
    for (let i = 0; i < 3; i++) { m4.makeTranslation(-s * (-0.045 + i * 0.0215) * -1 * -1, 0.015, 0.075 + i * 0.006); keys.setMatrixAt(n++, m4); }
    half.add(keys);
    const hex = cyl(0.021, 0.021, 0.014, red, -s * -0.04 * -1, 0.016, 0.062, 6);
    half.add(hex);
    half.rotation.z = s === -1 ? 0.42 : -0.42;
    half.position.y = 0.045;
    const plate = rbox(0.15, 0.006, 0.26, 0.003, silver, 0, 0.003, 0.01);
    const arm = bone([0, 0.006, 0.0], [s * -0.045 * -1, 0.05, 0.0], 0.006, 0.006, silver);
    const knob = cyl(0.011, 0.011, 0.012, mat('#f26a1b'), s * -0.045 * -1, 0.052, 0.0, 14); knob.rotation.z = Math.PI / 2; arm.add(knob);
    const h = group(plate, half, arm);
    h.position.x = s * 0.1;
    g.add(h); halves.push(h);
  }
  g.add(tube([[-0.015, 0.03, 0.0], [0, 0.0, 0.1], [0.015, 0.03, 0.0]], 0.004, mat('#18191b'), { segs: 24, radial: 6 }));
  return g;
}

export function verticalMouse() {
  /* Evoluent VerticalMouse : corps noir dressé, repose-pouce argenté, bouton cuivré. */
  const g = group();
  const black = mat('#1a1b1d', { roughness: 0.45 }), chrome = mat('#cfd2d6', { metalness: 0.8, roughness: 0.3 }), copper = mat('#a8613a', { metalness: 0.6, roughness: 0.4 });
  const body = group(
    rbox(0.044, 0.1, 0.12, 0.02, black, 0, 0.05, 0),
    rbox(0.012, 0.075, 0.075, 0.006, chrome, 0.027, 0.056, -0.005),
    rbox(0.046, 0.02, 0.12, 0.008, copper, 0, 0.012, 0),
    rbox(0.01, 0.012, 0.03, 0.004, chrome, 0.0, 0.098, -0.04),
  );
  body.rotation.z = -0.3;
  g.add(body);
  return g;
}

/* Lampe Brontes (Cini Boeri / Artemide) : fût rouge + calotte nervurée articulée */
export function brontes() {
  const g = group();
  const red = mat('#a93a29', { roughness: 0.4 }), alu = mat('#c8cbcf', { metalness: 0.7, roughness: 0.35 }), rubber = mat('#17181a');
  g.add(cyl(0.05, 0.05, 0.3, red, 0, 0.15, 0, 36));
  g.add(cyl(0.055, 0.055, 0.012, rubber, 0, 0.006, 0, 36));
  const glow = new THREE.MeshBasicMaterial({ color: '#fff0d0', toneMapped: false });
  const shade = group();
  const dome = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const d = mesh(dome, alu); d.scale.set(0.19, 0.07, 0.12); shade.add(d);
  for (let i = 1; i <= 5; i++) {
    const r = Math.cos(i * 0.26);
    const ring = mesh(new THREE.TorusGeometry(1, 0.035, 6, 36), alu);
    ring.rotation.x = Math.PI / 2; ring.scale.set(0.19 * r, 0.12 * r, 0.06 * Math.sin(i * 0.26) + 0.002);
    ring.position.y = 0.07 * Math.sin(i * 0.26);
    ring.scale.z = 0.02; shade.add(ring);
  }
  const rim = mesh(new THREE.TorusGeometry(1, 0.03, 8, 40), rubber); rim.rotation.x = Math.PI / 2; rim.scale.set(0.19, 0.12, 0.8); shade.add(rim);
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), glow);
  lamp.rotation.x = Math.PI / 2; lamp.scale.set(1, 0.66, 1); lamp.position.y = -0.002; lamp.rotation.x = Math.PI / 2; shade.add(lamp);
  shade.position.set(0, 0.31, 0.02);
  shade.rotation.set(0.0, 0.0, 0.34);
  g.add(shade);
  g.userData.glow = glow;
  g.userData.light = shade;
  return g;
}

/* ───────────── FAUTEUIL DE BUREAU ───────────── */
export function officeChair() {
  const g = group();
  const frame = mat('#d8d2bd'), brown = mat('#6d5846', { roughness: 0.95 }), black = mat('#18191b');
  const pivot = group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = box(0.3, 0.032, 0.045, frame, 0.15, 0, 0); spoke.rotation.y = 0; 
    const s = group(spoke, sph(0.03, black, 0.3, -0.01, 0));
    s.rotation.y = a; s.position.y = 0.06; g.add(s);
  }
  g.add(cyl(0.028, 0.034, 0.3, mat('#a9adb1', { metalness: 0.6, roughness: 0.4 }), 0, 0.22, 0));
  pivot.add(rbox(0.5, 0.07, 0.5, 0.03, brown, 0, 0.46, 0.02));
  pivot.add(rbox(0.46, 0.55, 0.035, 0.016, brown, 0, 0.8, -0.24).rotateX(0.1));
  for (const s of [-1, 1]) pivot.add(bone([s * 0.22, 0.48, -0.2], [s * 0.225, 0.78, -0.27], 0.014, 0.014, frame));
  pivot.add(rbox(0.5, 0.025, 0.04, 0.01, frame, 0, 0.5, -0.22));
  g.add(pivot);
  g.userData.pivot = pivot;
  return g;
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
  const per = 6, count = tips.length * per;
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
  g.rotation.y = Math.PI / 2;
  const out = group(g);
  return out;
}

/* ───────────── FAUTEUIL EKSTREM ───────────── */
export function ekstrem() {
  /* Ekstrem (Terje Ekstrøm) : un seul diamètre de tube capitonné, quatre pieds à embouts gris.
   *  - arche avant en « ∩ » qui porte les deux pieds de devant,
   *  - deux montants arrière verticaux dont le sommet se recourbe vers le centre (les deux bosses du « M »),
   *  - ces deux tubes redescendent en S, se croisent au centre et forment l'assise,
   *  - un accoudoir de chaque côté, du montant arrière jusqu'à l'arche. */
  const g = group();
  const fabric = mat('#2a2d36', { roughness: 1 });
  const R = 0.078, W = 0.37;
  const T = (pts, r = R) => g.add(tube(pts, r, fabric, { segs: 120, radial: 18 }));
  // arche avant
  T([[-W, 0.05, 0.37], [-W, 0.3, 0.37], [-W + 0.035, 0.425, 0.37], [-0.17, 0.46, 0.37], [0.17, 0.46, 0.37], [W - 0.035, 0.425, 0.37], [W, 0.3, 0.37], [W, 0.05, 0.37]]);
  for (const s of [-1, 1]) {
    const x = s * W;
    // montant arrière, bosse, descente en S vers le centre puis assise jusqu'à l'arche avant (côté opposé)
    T([[x, 0.05, -0.3], [x, 0.4, -0.3], [x, 0.7, -0.3], [x - s * 0.04, 0.83, -0.29], [x - s * 0.13, 0.82, -0.26], [x - s * 0.24, 0.7, -0.2],
       [-s * 0.01, 0.56, -0.12], [-s * 0.14, 0.45, 0.04], [-s * 0.25, 0.4, 0.21], [-s * 0.32, 0.43, 0.33], [-s * 0.34, 0.45, 0.37]]);
    // accoudoir
    T([[x, 0.58, -0.3], [x, 0.56, -0.05], [x, 0.5, 0.2], [x, 0.44, 0.37]], R * 0.96);
    // pieds : embouts gris
    g.add(cyl(R * 0.9, R * 0.98, 0.035, mat('#4a4c52', { roughness: 0.55 }), x, 0.0175, 0.37, 22));
    g.add(cyl(R * 0.9, R * 0.98, 0.035, mat('#4a4c52', { roughness: 0.55 }), x, 0.0175, -0.3, 22));
  }
  return bake(g);
}

/* ───────────── LAMPADAIRE EN ARC ───────────── */
export function arcLamp() {
  const g = group();
  const chrome = mat('#b4b8be', { metalness: 0.9, roughness: 0.28 }), black = mat('#16171a', { roughness: 0.4 });
  g.add(rbox(0.38, 0.05, 0.3, 0.012, mat('#17181a', { roughness: 0.35 }), 0, 0.025, 0));
  const path = [[0, 0.05, 0], [0, 1.1, 0], [0.04, 1.75, 0], [0.3, 2.1, 0], [0.8, 2.22, 0], [1.3, 2.2, 0]];
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
  const g = group();
  const side = mat('#3b2616', { roughness: 0.7 });
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const geo = new THREE.BoxGeometry(0.56, 0.642, 0.03);
  const m = mesh(geo, [side, side, side, side, front, side]);
  m.position.y = 0.321;
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
  const g = group();
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0.3, 0); s.lineTo(0.3, 0.04);
  s.bezierCurveTo(0.12, 0.04, 0.075, 0.08, 0.075, 0.14);
  s.lineTo(0.1115, 0.152);
  s.absarc(0.095, 0.235, 0.085, -Math.PI / 2 + 0.2, Math.PI, false);
  s.lineTo(0, 0.235); s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 24 });
  geo.translate(-0.15, 0, -0.15);
  const bump = canvasTexture(128, 128, (c, w, h) => {
    const id = c.createImageData(w, h);
    for (let i = 0; i < id.data.length; i += 4) { const v = 120 + Math.random() * 100; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    c.putImageData(id, 0, 0);
  });
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  const m = new THREE.MeshStandardMaterial({ color: '#8f8e89', roughness: 1, bumpMap: bump, bumpScale: 0.8 });
  const body = mesh(geo, m);
  body.rotation.y = -Math.PI / 2;
  const glowM = new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false });
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.07), glowM);
  slot.rotation.x = Math.PI / 2; slot.position.set(0.0, 0.151, 0.03);
  g.add(body, slot);
  g.userData.glow = glowM;
  return g;
}

/* ───────────── ENCEINTE (type lampe-enceinte) ───────────── */
export function speaker() {
  const g = group();
  g.add(cyl(0.07, 0.08, 0.2, mat('#2b2b2e', { roughness: 1 }), 0, 0.1, 0, 32));
  g.add(cyl(0.083, 0.083, 0.012, mat('#17181a'), 0, 0.006, 0, 32));
  const head = rbox(0.17, 0.19, 0.13, 0.05, mat('#6a6a70', { roughness: 0.95 }), 0, 0.3, 0);
  g.add(head);
  g.add(cyl(0.035, 0.035, 0.03, mat('#2b2b2e'), 0, 0.21, 0, 20));
  g.userData.head = head;
  return g;
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

/* ───────────── ÉTAGÈRES ───────────── */
export function shelf(seed = 1) {
  const r = rng(seed);
  const g = group();
  const frame = mat('#a8a48e', { roughness: 0.5, metalness: 0.3 }), board = mat('#c8c4ac', { roughness: 0.85 });
  const W = 0.8, D = 0.36, H = 0.9;
  for (const x of [-W / 2 + 0.015, W / 2 - 0.015]) for (const z of [-D / 2 + 0.015, D / 2 - 0.015]) g.add(cyl(0.011, 0.011, H, frame, x, H / 2, z, 8));
  for (const y of [0.04, H * 0.5, H - 0.01]) g.add(box(W, 0.016, D, board, 0, y, 0));
  const cols = ['#e8452b', '#243044', '#f3b43f', '#5aa97a', '#6ea0e0', '#8a5a44', '#efe6d2'];
  for (const y of [0.048, H * 0.5 + 0.008]) {
    let x = -W / 2 + 0.06;
    const n = 4 + ((r() * 4) | 0);
    for (let i = 0; i < n && x < W / 2 - 0.08; i++) {
      const th = 0.025 + r() * 0.03, h = 0.17 + r() * 0.1;
      g.add(box(th, h, 0.2, mat(cols[(r() * cols.length) | 0], { roughness: 0.8 }), x, y + h / 2, 0.0));
      x += th + 0.003;
    }
  }
  return bake(g);
}
