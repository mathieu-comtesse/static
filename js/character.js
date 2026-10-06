import { THREE, mat, rng, loadBuffer } from './kit.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

/* Personnage reconstruit d'après l'analyse du « Shupi » de shujaat.info (proportions mesurées, pièces séparées, style facetté) :
 *   chibi (tête ≈ 28 % de la hauteur), buste court, jambes courtes, baskets montantes énormes, poings cubiques.
 *   Pièces : crâne, mâchoire, oreilles, cheveux, barbe, plaque d'expression, cou · tee-shirt · veste ouverte (dos, côtés, pans, empiècement,
 *   col, manches + revers) · short cargo (bassin, jambes, poches, revers) · baskets (tige, bout, semelle, languette, talon) · badge.
 *   Squelette : os du rig de ton dépôt (cv-mathieu_comtesse), longueurs ajustées aux proportions du modèle ; animations : anims.glb. */

const C = {
  skin: '#e7bd9c', skinShade: '#c99a7a', hairA: '#b3935f', hairB: '#8d6e46', hairC: '#c9ab76', hairD: '#9c7a4e', beard: '#bd7a47', beardD: '#a2612f',
  tee: '#fcfae2', jacket: '#8aa5d1', jacketD: '#3d5bb0', lining: '#27337a', pants: '#1c2542', pantsL: '#27345d',
  red: '#8f1d0a', redD: '#4a0e05', sole: '#d9d19a', heel: '#4a5348', tongue: '#ded8a2', badge: '#101114', lanyard: '#a5c82a',
};

/* ─── plaque d'expression : décalcomanies en pixels (comme les « face_*.png » du modèle) ─── */
const FW = 40, FH = 42;
function faceTexture(kind) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const r = rng(3);
  px(0, 0, FW, FH, C.skin);
  for (let y = 21; y < FH; y++) for (let x = 0; x < FW; x++) {
    const side = x < 5 || x > FW - 6, low = y > 26;
    if ((side && y > 18) || low) px(x, y, 1, 1, r() > 0.8 ? '#c98b55' : r() > 0.72 ? C.beardD : C.beard);
  }
  px(10, 24, 20, 3, C.beardD);
  px(17, 18, 6, 6, '#d6a283'); px(18, 24, 4, 1, '#d6a283');
  const big = kind === 'amazed' ? 2 : 0;
  const eye = (cx, closed) => {
    if (closed) { px(cx - 4, 16, 9, 1, '#3d2c1c'); return; }
    px(cx - 4, 13 - big, 9, 7 + big * 2, '#f7f4ee');
    px(cx - 2, 14 - big, 5, 5 + big, '#7fa0b4'); px(cx - 1, 15 - big, 3, 3 + big, '#15181c'); px(cx, 14 - big, 1, 1, '#ffffff');
  };
  if (kind === 'happy') { for (const cx of [10, 29]) { px(cx - 3, 17, 7, 1, '#3d2c1c'); px(cx - 4, 18, 2, 1, '#3d2c1c'); px(cx + 3, 18, 2, 1, '#3d2c1c'); } }
  else { const closed = kind === 'blink' || kind === 'sip'; eye(10, closed); eye(29, closed); }
  const brow = (x0, tilt) => { for (let i = 0; i < 9; i++) px(x0 + i, 10 + tilt(i) - (kind === 'amazed' ? 2 : 0), 1, 2, '#7a5a36'); };
  brow(6, (i) => (kind === 'happy' ? 0 : i < 4 ? 1 : 0)); brow(25, (i) => (kind === 'happy' ? 0 : i > 4 ? 1 : 0));
  const mouth = {
    neutral: () => px(15, 31, 10, 2, '#7a3b32'), blink: () => px(15, 31, 10, 2, '#7a3b32'),
    happy: () => { px(13, 30, 14, 4, '#7a3b32'); px(14, 30, 12, 1, '#fbf6ee'); },
    amazed: () => { px(16, 29, 8, 7, '#5a2a26'); px(17, 30, 6, 5, '#7a3b32'); },
    talkA: () => { px(14, 30, 12, 5, '#5a2a26'); px(15, 31, 10, 1, '#fbf6ee'); },
    talkO: () => { px(17, 30, 6, 5, '#5a2a26'); },
    sip: () => { px(17, 30, 6, 4, '#7a3b32'); px(16, 31, 8, 2, '#7a3b32'); },
  }[kind] || (() => {});
  mouth();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

/* ─── primitives facettées ─── */
function cbox(w, h, d, c = 0.02) {              // boîte chanfreinée, centrée
  c = Math.min(c, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const s = new THREE.Shape(), a = w / 2 - c, b = h / 2 - c, depth = Math.max(d - 2 * c, 1e-4);
  s.moveTo(-a, -b); s.lineTo(a, -b); s.lineTo(a, b); s.lineTo(-a, b); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function frus(wt, wb, h, dt, db) {              // tronc de pyramide rectangulaire (haut/bas distincts)
  const g = new THREE.CylinderGeometry(0.5, 0.5, h, 4, 1); g.rotateY(Math.PI / 4);
  const p = g.attributes.position, k = Math.SQRT2;
  for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setX(i, p.getX(i) * k * (top ? wt : wb)); p.setZ(i, p.getZ(i) * k * (top ? dt : db)); }
  g.computeVertexNormals(); return g;
}
function spike(w, h, d) { const g = new THREE.ConeGeometry(0.5, h, 4, 1); g.rotateY(Math.PI / 4); g.scale(w * Math.SQRT2, 1, d * Math.SQRT2); return g; }
function facet(rx, ry, rz) { const g = new THREE.IcosahedronGeometry(1, 0); g.scale(rx, ry, rz); return g; }

export async function createCharacter({ rigUrl = 'assets/rig.json', animsUrl = 'assets/anims.glb' } = {}) {
  const rig = JSON.parse(new TextDecoder().decode(await loadBuffer(rigUrl)));
  const gltf = await new Promise(async (res, rej) => new GLTFLoader().parse(await loadBuffer(animsUrl), '', res, rej));

  /* ── squelette : os du rig, repositionnés sur les proportions chibi ── */
  const group = new THREE.Group();
  const bones = {}, list = [];
  for (const b of rig) {
    const bone = new THREE.Bone(); bone.name = b.n;
    bone.position.fromArray(b.pos); bone.quaternion.fromArray(b.q);
    bones[b.n] = bone; list.push(bone);
    if (b.p) bones[b.p].add(bone);
  }
  group.add(bones.root);
  const TARGET = {                                          // positions monde au repos (pose en T), en mètres ; côté gauche (+x), miroir pour la droite
    pelvis: [0, 0.64, -0.02], spine_01: [0, 0.72, -0.02], spine_02: [0, 0.835, -0.02], spine_03: [0, 0.955, -0.02], neck_01: [0, 1.06, -0.02], Head: [0, 1.12, -0.01],
    clavicle: [0.02, 1.0, -0.01], upperarm: [0.19, 0.995, -0.03], lowerarm: [0.4, 0.995, -0.03], hand: [0.53, 0.995, -0.03],
    thigh: [0.16, 0.66, -0.02], calf: [0.165, 0.45, -0.02], foot: [0.17, 0.235, -0.03], ball: [0.17, 0.15, 0.08],
  };
  group.updateMatrixWorld(true);
  for (const b of rig) {
    const side = /_l$/.test(b.n) ? 1 : /_r$/.test(b.n) ? -1 : 0;
    const key = b.n.replace(/_[lr]$/, '');
    const t = TARGET[key]; if (!t) continue;
    const bone = bones[b.n];
    bone.position.copy(bone.parent.worldToLocal(new THREE.Vector3(side ? t[0] * side : t[0], t[1], t[2])));
    bone.updateMatrixWorld(true);
  }
  const wp = (n) => bones[n].getWorldPosition(new THREE.Vector3());
  const skeleton = new THREE.Skeleton(list);
  const idx = Object.fromEntries(rig.map((b, i) => [b.n, i]));

  /* ── pièces rigides, chacune liée à un os ── */
  const buckets = new Map();
  const part = (bone, geo, x, y, z, color, o = {}) => {
    if (o.rot) geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...o.rot)));
    geo.translate(x, y, z);
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = idx[bone]; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    const key = o.mesh || color;
    if (!buckets.has(key)) buckets.set(key, { color, list: [], name: key });
    buckets.get(key).list.push(g);
  };
  const rr = rng(8), jit = (a) => (rr() - 0.5) * a;

  /* ── tête (≈ 28 % de la hauteur) : crâne, mâchoire, oreilles, cou ── */
  part('Head', cbox(0.38, 0.2, 0.34, 0.04), 0, 1.3, 0.05, C.skin, { mesh: 'skin' });
  part('Head', frus(0.38, 0.28, 0.13, 0.34, 0.28), 0, 1.165, 0.07, C.skin, { mesh: 'skin' });
  for (const s of [-1, 1]) {
    part('Head', cbox(0.04, 0.085, 0.065, 0.012), s * 0.205, 1.25, 0.02, C.skin, { mesh: 'skin' });
    part('Head', cbox(0.02, 0.045, 0.035, 0.006), s * 0.212, 1.25, 0.03, C.skinShade, { mesh: 'skinShade' });
  }
  part('neck_01', cbox(0.13, 0.1, 0.12, 0.02), 0, 1.075, -0.01, C.skinShade, { mesh: 'skinShade' });

  /* ── barbe rousse : menton, favoris, moustache (le reste est dessiné sur la plaque) ── */
  part('Head', cbox(0.27, 0.075, 0.1, 0.025), 0, 1.13, 0.19, C.beard, { mesh: 'beard' });
  for (const s of [-1, 1]) {
    part('Head', cbox(0.045, 0.15, 0.22, 0.015), s * 0.185, 1.2, 0.07, C.beard, { mesh: 'beard' });
    part('Head', cbox(0.045, 0.08, 0.09, 0.012), s * 0.17, 1.13, 0.16, C.beardD, { mesh: 'beardD' });
  }
  part('Head', frus(0.15, 0.2, 0.03, 0.04, 0.05), 0, 1.222, 0.232, C.beardD, { mesh: 'beardD' });

  /* ── cheveux bouclés, facettés et groupés comme les mèches du modèle : calotte, frange en pointes, nuque, côtés ── */
  const hair = [C.hairA, C.hairB, C.hairC, C.hairD];
  const curl = (x, y, z, rx, ry = rx, rz = rx) => { const ci = (rr() * 4) | 0; part('Head', facet(rx, ry, rz), x, y, z, hair[ci], { mesh: 'hair' + ci, rot: [jit(1.2), jit(2.4), jit(1.2)] }); };
  for (let ix = -2; ix <= 2; ix++) for (let iz = -2; iz <= 2; iz++) { if (Math.abs(ix) === 2 && Math.abs(iz) === 2) continue; curl(ix * 0.085 + jit(0.03), 1.44 + jit(0.04) - (Math.abs(ix) + Math.abs(iz)) * 0.012, iz * 0.085 + 0.04 + jit(0.03), 0.085 + rr() * 0.025, 0.07 + rr() * 0.02, 0.085 + rr() * 0.025); }
  for (let i = 0; i < 9; i++) curl(-0.18 + i * 0.045 + jit(0.02), 1.27 + jit(0.08), -0.14 - rr() * 0.03, 0.07 + rr() * 0.025, 0.09 + rr() * 0.03, 0.07);
  for (let i = 0; i < 6; i++) curl(-0.14 + i * 0.056, 1.15 + jit(0.03), -0.13 - rr() * 0.03, 0.06 + rr() * 0.02);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) curl(s * (0.2 + rr() * 0.02), 1.38 - i * 0.045, -0.02 - i * 0.045, 0.07 + rr() * 0.02, 0.06 + rr() * 0.03, 0.08);
  for (let i = 0; i < 7; i++) {                                   // frange : pointes qui retombent sur le front
    const x = (i - 3) * 0.052 + jit(0.01);
    part('Head', spike(0.075, 0.13 + rr() * 0.04, 0.07), x, 1.375 - Math.abs(i - 3) * 0.006, 0.215, hair[(rr() * 4) | 0], { mesh: 'hair' + ((rr() * 4) | 0), rot: [Math.PI + 0.25, jit(0.5), jit(0.4)] });
  }
  for (const s of [-1, 1]) part('Head', spike(0.07, 0.12, 0.07), s * 0.17, 1.38, 0.19, C.hairB, { mesh: 'hair1', rot: [Math.PI + 0.2, 0, s * -0.3] });

  /* ── buste : tee-shirt crème, veste ouverte (dos, côtés, pans, empiècement, col) ── */
  part('spine_02', cbox(0.34, 0.4, 0.27, 0.03), 0, 0.915, -0.03, C.tee, { mesh: 'shirt' });
  part('spine_02', cbox(0.5, 0.44, 0.06, 0.02), 0, 0.9, -0.17, C.jacket, { mesh: 'jacket' });
  for (const s of [-1, 1]) {
    part('spine_02', frus(0.075, 0.095, 0.44, 0.28, 0.3), s * 0.215, 0.9, -0.04, C.jacketD, { mesh: 'jacketD' });
    part('spine_02', frus(0.15, 0.17, 0.42, 0.075, 0.075), s * 0.158, 0.9, 0.085, C.jacket, { mesh: 'jacket', rot: [0, -s * 0.1, 0] });
    part('spine_03', frus(0.1, 0.14, 0.05, 0.1, 0.14), s * 0.095, 1.14, 0.045, C.jacket, { mesh: 'jacket', rot: [-0.25, -s * 0.5, s * 0.25] });
  }
  part('spine_03', cbox(0.5, 0.075, 0.31, 0.025), 0, 1.075, -0.03, C.jacket, { mesh: 'jacket' });
  part('spine_03', cbox(0.28, 0.04, 0.2, 0.01), 0, 1.115, -0.075, C.lining, { mesh: 'lining' });

  /* ── bassin, short cargo (deux jambes distinctes), revers, poches, badge ── */
  part('pelvis', cbox(0.53, 0.15, 0.28, 0.03), 0, 0.705, -0.02, C.pants, { mesh: 'legs' });
  part('pelvis', cbox(0.05, 0.085, 0.01, 0.003), -0.1, 0.655, 0.125, C.badge, { mesh: 'badge' });
  part('pelvis', cbox(0.012, 0.03, 0.012, 0.002), -0.1, 0.71, 0.12, '#8d9aa5', { mesh: 'clip' });
  part('pelvis', cbox(0.006, 0.12, 0.006, 0.001), -0.098, 0.67, 0.133, C.lanyard, { mesh: 'lanyard' });
  for (const s of [-1, 1]) {
    const sd = s === 1 ? 'l' : 'r';
    const hx = s * 0.165, fx = s * 0.2;
    part('thigh_' + sd, frus(0.27, 0.285, 0.25, 0.27, 0.275), hx, 0.615, -0.02, C.pants, { mesh: 'legs' });
    part('thigh_' + sd, cbox(0.05, 0.14, 0.17, 0.012), s * 0.325, 0.56, -0.02, C.pantsL, { mesh: 'legsL' });         // poche cargo
    part('calf_' + sd, frus(0.285, 0.3, 0.2, 0.275, 0.285), hx, 0.4, -0.02, C.pants, { mesh: 'legs' });
    part('calf_' + sd, frus(0.3, 0.33, 0.08, 0.285, 0.31), hx, 0.31, -0.02, C.pantsL, { mesh: 'legsL' });              // revers
    part('calf_' + sd, cbox(0.13, 0.07, 0.13, 0.015), fx, 0.255, -0.03, C.skinShade, { mesh: 'skinShade' });          // cheville
    // baskets montantes énormes : tige, bout, semelle, languette, talon (≈ 0,31 × 0,43 × 0,30 m)
    part('foot_' + sd, cbox(0.31, 0.05, 0.45, 0.015), fx, 0.025, 0.045, C.sole, { mesh: 'sole' });
    part('foot_' + sd, cbox(0.28, 0.25, 0.26, 0.025), fx, 0.175, -0.055, C.redD, { mesh: 'redD' });
    part('foot_' + sd, cbox(0.11, 0.03, 0.22, 0.01), fx, 0.29, -0.06, C.redD, { mesh: 'redD' });
    part('foot_' + sd, frus(0.25, 0.28, 0.1, 0.19, 0.22), fx, 0.1, 0.165, C.red, { mesh: 'red' });
    part('foot_' + sd, frus(0.22, 0.28, 0.1, 0.11, 0.19), fx, 0.1, 0.265, C.red, { mesh: 'red' });
    part('foot_' + sd, cbox(0.28, 0.045, 0.03, 0.008), fx, 0.07, 0.29, C.sole, { mesh: 'sole' });
    part('foot_' + sd, frus(0.08, 0.13, 0.13, 0.03, 0.12), fx, 0.255, 0.085, C.tongue, { mesh: 'tongue', rot: [0.55, 0, 0] });
    part('foot_' + sd, frus(0.055, 0.11, 0.04, 0.03, 0.11), fx, 0.145, 0.2, C.tongue, { mesh: 'tongue', rot: [0.2, 0, 0] });
    part('foot_' + sd, frus(0.21, 0.25, 0.13, 0.075, 0.1), fx, 0.105, -0.19, C.heel, { mesh: 'heel' });
    // chaussettes tabi (rituel du thé : on retire les chaussures)
    part('foot_' + sd, cbox(0.13, 0.07, 0.27, 0.02), fx, 0.05, 0.07, '#f4f1ea', { mesh: 'tabi' });
    part('foot_' + sd, cbox(0.055, 0.05, 0.09, 0.015), fx - 0.035, 0.035, 0.22, '#f4f1ea', { mesh: 'tabi' });
    part('foot_' + sd, cbox(0.055, 0.05, 0.09, 0.015), fx + 0.035, 0.035, 0.22, '#f4f1ea', { mesh: 'tabi' });
    part('calf_' + sd, cbox(0.11, 0.17, 0.11, 0.015), fx, 0.17, -0.03, C.skin, { mesh: 'skin' });                    // mollet nu
  }

  /* ── bras : épaule, manche à revers, avant-bras, poing cubique ── */
  for (const s of [-1, 1]) {
    const sd = s === 1 ? 'l' : 'r';
    part('upperarm_' + sd, cbox(0.16, 0.17, 0.17, 0.035), s * 0.19, 0.995, -0.03, C.jacket, { mesh: 'jacket' });
    part('upperarm_' + sd, frus(0.2, 0.155, 0.2, 0.17, 0.15), s * 0.29, 0.995, -0.03, C.jacket, { mesh: 'jacket', rot: [0, 0, s * Math.PI / 2] });
    part('lowerarm_' + sd, frus(0.05, 0.05, 0.05, 0.14, 0.155), s * 0.382, 0.995, -0.03, C.jacketD, { mesh: 'jacketD', rot: [0, 0, s * Math.PI / 2] });
    part('lowerarm_' + sd, cbox(0.03, 0.17, 0.18, 0.01), s * 0.405, 0.995, -0.03, C.jacket, { mesh: 'jacket' });
    part('lowerarm_' + sd, frus(0.13, 0.1, 0.13, 0.115, 0.095), s * 0.47, 0.995, -0.03, C.skin, { mesh: 'skin', rot: [0, 0, s * Math.PI / 2] });
    part('hand_' + sd, frus(0.17, 0.12, 0.14, 0.145, 0.12), s * 0.6, 0.995, -0.03, C.skin, { mesh: 'skin', rot: [0, 0, s * Math.PI / 2] });
    part('hand_' + sd, cbox(0.05, 0.05, 0.09, 0.012), s * 0.58, 1.045, -0.005, C.skinShade, { mesh: 'skinShade' });
  }

  /* ── maillages skinnés (un par matériau) ── */
  const meshes = [], byName = {};
  for (const [, b] of buckets) {
    const geo = mergeGeometries(b.list, false);
    const sm = new THREE.SkinnedMesh(geo, new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.85, flatShading: true }));
    sm.name = b.name; sm.castShadow = sm.receiveShadow = true; sm.frustumCulled = false;
    group.add(sm); meshes.push(sm); byName[b.name] = sm;
  }
  const shoeNames = ['sole', 'redD', 'red', 'tongue', 'heel'], tabi = byName.tabi;
  tabi.visible = false;
  // plaque d'expression : devant le visage
  const faces = {}; for (const k of ['neutral', 'blink', 'happy', 'amazed', 'talkA', 'talkO', 'sip']) faces[k] = faceTexture(k);
  const plateGeo = new THREE.PlaneGeometry(0.29, 0.3); plateGeo.translate(0, 1.255, 0.2225);
  { const n = plateGeo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = idx.Head; sw[i * 4] = 1; } plateGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); plateGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
  const plateMat = new THREE.MeshStandardMaterial({ map: faces.neutral, roughness: 0.9 });
  const plate = new THREE.SkinnedMesh(plateGeo, plateMat); plate.name = 'expression_plate'; plate.frustumCulled = false; plate.receiveShadow = true;
  group.add(plate); meshes.push(plate);
  group.updateMatrixWorld(true);
  for (const m of meshes) m.bind(skeleton, new THREE.Matrix4());

  /* ── animations de ton dépôt, hauteur du bassin ramenée aux proportions chibi ── */
  const mixer = new THREE.AnimationMixer(group);
  const k = 0.64 / 1.1;
  const clips = Object.fromEntries(gltf.animations.map((a) => {
    const c = a.clone();
    for (const t of c.tracks) if (t.name === 'pelvis.position') for (let i = 0; i < t.values.length; i++) t.values[i] *= k;
    return [a.name, c];
  }));
  let action = null;

  /* ── accessoire : arrosoir tenu à la main (orienté dans le repère du personnage) ── */
  const can = new THREE.Group(), canTip = new THREE.Object3D();
  { const green = mat('#3f8f6a'), inner = new THREE.Group();
    const body = new THREE.Mesh(cbox(0.15, 0.14, 0.15, 0.03), green); body.castShadow = true;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.24, 8), green); spout.rotation.z = -1.05; spout.position.set(0.17, 0.07, 0); spout.castShadow = true;
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.03, 10), green); rose.rotation.z = -1.05; rose.position.set(0.275, 0.124, 0);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 6, 14, Math.PI), green); handle.position.set(-0.03, 0.09, 0); handle.castShadow = true;
    inner.add(body, spout, rose, handle); inner.rotation.y = -Math.PI / 2;
    canTip.position.set(0.3, 0.14, 0); inner.add(canTip);
    can.add(inner); can.visible = false; group.add(can); }

  /* ── outils de pose : rotation d'un os dans le repère du personnage, visée (aim) et IK à deux os ── */
  const _pq = new THREE.Quaternion(), _qg = new THREE.Quaternion(), _R = new THREE.Quaternion(), _M = new THREE.Quaternion(), _v = new THREE.Vector3();
  const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
  const applyWorldRot = (bone, qWorld) => {                                 // qWorld : rotation monde à appliquer à l'os
    bone.parent.getWorldQuaternion(_pq);
    _M.copy(_pq).invert().multiply(qWorld).multiply(_pq);
    bone.quaternion.premultiply(_M); group.updateMatrixWorld(true);
  };
  const rotChar = (bone, ang, axis = _X) => {                               // rotation autour d'un axe du repère du personnage
    group.getWorldQuaternion(_qg);
    _R.setFromAxisAngle(axis, ang);
    applyWorldRot(bone, _qg.clone().multiply(_R).multiply(_qg.clone().invert()));
  };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  const aim = (bone, targetWorld) => {                                       // oriente l'axe +Y de l'os vers la cible
    bone.getWorldPosition(_a); bone.getWorldQuaternion(_q1);
    _b.copy(_Y).applyQuaternion(_q1);
    _v.copy(targetWorld).sub(_a).normalize();
    _q2.setFromUnitVectors(_b, _v);
    applyWorldRot(bone, _q2.clone());
  };
  const ik2 = (upper, lower, end, target, pole) => {                         // IK analytique à deux os (cible et pôle en monde)
    group.updateMatrixWorld(true);
    const S = upper.getWorldPosition(new THREE.Vector3()), E0 = lower.getWorldPosition(new THREE.Vector3()), H0 = end.getWorldPosition(new THREE.Vector3());
    const l1 = S.distanceTo(E0), l2 = E0.distanceTo(H0);
    const dir = target.clone().sub(S), dist = Math.min(dir.length(), (l1 + l2) * 0.999); dir.normalize();
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const pv = pole.clone().sub(S); pv.addScaledVector(dir, -pv.dot(dir)).normalize();
    const E = S.clone().addScaledVector(dir, a).addScaledVector(pv, h);
    aim(upper, E); aim(lower, S.clone().addScaledVector(dir, dist));
  };

  /* ── expressions et surcharges ── */
  let base = 'neutral', blink = 0, nextBlink = 2, flash = 0, flashKind = null, talk = false;
  let ov = null, ovW = 0, post = null;
  const setFace = (kind) => { if (plateMat.map !== faces[kind]) plateMat.map = faces[kind]; };

  return {
    group, bones, skeleton, can, canTip, head: bones.Head, clips: Object.keys(clips), rotChar, aim, ik2, wp, mixer,
    play(name, { fade = 0.25, speed = 1 } = {}) {
      const clip = clips[name]; if (!clip) return;
      const next = mixer.clipAction(clip); next.setEffectiveTimeScale(speed); next.reset().fadeIn(fade).play();
      if (action && action !== next) action.fadeOut(fade);
      action = next;
    },
    stop() { if (action) { action.stop(); action = null; } mixer.stopAllAction(); },
    setBase(kind) { base = kind; },
    setOverride(o) { ov = o; if (o) ovW = 0; },
    setPost(fn) { post = fn; },                      // fonction appelée après l'animation, pour les poses pilotées par IK
    setShoes(on) { for (const n of shoeNames) byName[n].visible = on; tabi.visible = !on; },
    flash(kind, secs = 0.7) { flashKind = kind; flash = secs; },
    talk(on) { talk = on; },
    update(dt, t) {
      mixer.update(dt);
      group.updateMatrixWorld(true);
      if (ov) {
        ovW += (1 - ovW) * (1 - Math.exp(-dt * 7));
        if (ov.lean) for (const n of ['spine_01', 'spine_02', 'spine_03']) rotChar(bones[n], ov.lean * ovW / 3);
        if (ov.armR) rotChar(bones.upperarm_r, ov.armR * ovW);
        if (ov.foreR) rotChar(bones.lowerarm_r, ov.foreR * ovW);
        if (ov.armL) rotChar(bones.upperarm_l, ov.armL * ovW);
        if (ov.foreL) rotChar(bones.lowerarm_l, ov.foreL * ovW);
        if (ov.head) rotChar(bones.Head, ov.head * ovW);
      }
      if (post) post(dt, t);
      if (can.visible) {
        group.updateMatrixWorld(true);
        bones.hand_r.getWorldPosition(_v);
        can.position.copy(group.worldToLocal(_v)); can.position.y -= 0.02; can.position.z += 0.07;
        can.quaternion.identity(); can.rotation.z = -0.35 - Math.sin(t * 2.4) * 0.05;
      }
      nextBlink -= dt;
      if (nextBlink < 0) { blink = 0.13; nextBlink = 2 + Math.random() * 3.2; }
      blink = Math.max(0, blink - dt); flash = Math.max(0, flash - dt);
      let kd = base;
      if (flash > 0) kd = flashKind;
      else if (talk) kd = Math.sin(t * 11) > 0.2 ? 'talkA' : Math.sin(t * 7) > 0 ? 'talkO' : base;
      else if (blink > 0 && base !== 'happy') kd = 'blink';
      setFace(kd);
    },
  };
}
