import { THREE, mat, rng, loadBuffer } from './kit.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

/* Personnage reconstruit d'après l'analyse du « Shupi » de shujaat.info (proportions mesurées, pièces séparées, style facetté) :
 *   chibi (tête ≈ 28 % de la hauteur), buste court, jambes courtes, baskets montantes énormes, poings cubiques.
 *   Pièces : crâne, mâchoire, oreilles, cheveux, barbe, plaque d'expression, cou · tee-shirt · veste ouverte (dos, côtés, pans, empiècement,
 *   col, manches + revers) · short cargo (bassin, jambes, poches, revers) · baskets (tige, bout, semelle, languette, talon) · badge.
 *   Squelette : os du rig de ton dépôt (cv-mathieu_comtesse), longueurs ajustées aux proportions du modèle ; animations : anims.glb. */

const C = {
  skin: '#b0691f', skinShade: '#86501b', hair: '#0b080b', hairB: '#17121a', beard: '#0d0a0d', brow: '#0a070a',
  tee: '#fffce6', jacket: '#94afdb', jacketD: '#4565bd', lining: '#2a3a8a', pants: '#1f2a4d', pantsL: '#2a3a68',
  red: '#8f1d0a', redD: '#4a0e05', sole: '#d9d19a', heel: '#4a5348', tongue: '#ded8a2', badge: '#101114', lanyard: '#a5c82a',
  frame: '#a29d95', lens: '#8aa5d1', eye: '#35232f', mouth: '#c4703f',
};

/* ─── plaque d'expression : yeux rectangulaires sombres + bouche cuivrée, comme les « face_*.png » du modèle ─── */
const FW = 48, FH = 52;
function faceTexture(kind) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px(0, 0, FW, FH, C.skin);
  // barbe noire : joues, menton, moustache ; la bouche reste dégagée
  for (let y = 24; y < FH; y++) for (let x = 0; x < FW; x++) {
    const side = x < 6 || x > FW - 7, low = y > 42, must = y >= 30 && y < 34 && x > 12 && x < FW - 13;
    if (side && y > 34 || low || must) px(x, y, 1, 1, C.beard);
  }
  px(15, 34, 18, 3, C.skin); px(14, 36, 20, 1, C.skin);                // contour de la bouche
  px(21, 26, 6, 6, C.skinShade);                                        // nez
  const eyeY = 16, ex = [13, 33];
  const eyes = {
    blink: () => ex.forEach((x) => px(x - 3, eyeY + 4, 7, 1.5, C.eye)),
    amazed: () => ex.forEach((x) => { px(x - 2, eyeY + 1, 5, 5, C.eye); }),
    happy: () => ex.forEach((x) => { px(x - 3, eyeY + 4, 7, 1.5, C.eye); px(x - 4, eyeY + 5, 2, 1, C.eye); px(x + 3, eyeY + 5, 2, 1, C.eye); }),
  };
  (eyes[kind] || (() => ex.forEach((x) => px(x - 2, eyeY, 4, 9, C.eye))))();
  const mouth = {
    neutral: () => { px(18, 35, 12, 2, C.mouth); },
    blink: () => { px(18, 35, 12, 2, C.mouth); },
    happy: () => { px(16, 34, 16, 5, '#f26a45'); px(17, 34, 14, 1.5, '#fbf6ee'); px(19, 37, 10, 2, '#f19a8a'); },
    amazed: () => { px(19, 34, 10, 6, '#f26a45'); px(21, 35, 6, 1.5, '#fbf6ee'); },
    talkA: () => { px(16, 34, 16, 7, '#8f1c05'); px(17, 34, 14, 1.5, '#fbf6ee'); px(20, 38, 8, 2, '#f08a78'); },
    talkO: () => { px(20, 34, 8, 7, '#8f1c05'); px(21, 34, 6, 1.5, '#fbf6ee'); },
    sip: () => { px(21, 35, 6, 4, C.mouth); px(20, 36, 8, 2, C.mouth); },
  }[kind] || (() => px(18, 35, 12, 2, C.mouth));
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
    if (o.yaw) { const [cx, cz, a] = o.yaw; geo.translate(-cx, 0, -cz); geo.rotateY(a); geo.translate(cx, 0, cz); }
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const n = g.attributes.position.count;
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = idx[bone]; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    const key = o.mesh || color;
    if (!buckets.has(key)) buckets.set(key, { color, list: [], name: key, glass: !!o.glass });
    buckets.get(key).list.push(g);
  };
  const rr = rng(8), jit = (a) => (rr() - 0.5) * a;

  /* ── tête (face carrée en pyramide tronquée), oreilles, nez, cou ── */
  part('Head', frus(0.35, 0.29, 0.29, 0.31, 0.27), 0, 1.235, 0.065, C.skin, { mesh: 'skin' });
  part('Head', cbox(0.04, 0.045, 0.04, 0.008), 0, 1.205, 0.235, C.skinShade, { mesh: 'skinShade' });                // nez
  for (const s of [-1, 1]) {
    part('Head', cbox(0.04, 0.085, 0.07, 0.012), s * 0.19, 1.245, 0.02, C.skin, { mesh: 'skin' });
    part('Head', cbox(0.02, 0.05, 0.04, 0.006), s * 0.198, 1.245, 0.03, C.skinShade, { mesh: 'skinShade' });
  }
  part('neck_01', cbox(0.13, 0.1, 0.12, 0.02), 0, 1.075, -0.01, C.skinShade, { mesh: 'skinShade' });

  /* ── barbe noire : mâchoires et menton ── */
  part('Head', frus(0.28, 0.22, 0.07, 0.1, 0.08), 0, 1.1, 0.15, C.beard, { mesh: 'beard' });
  for (const s of [-1, 1]) part('Head', cbox(0.05, 0.15, 0.22, 0.018), s * 0.178, 1.15, 0.07, C.beard, { mesh: 'beard' });

  /* ── cheveux noirs : grosse coupe en bol facettée (calotte, nuque, mèches latérales, frange droite) ── */
  const hk = (x, y, z, w, h, d, rot, key = 'hair') => part('Head', frus(w * 0.8, w, h, d * 0.8, d), x, y, z, key === 'hair' ? C.hair : C.hairB, { mesh: key, rot });
  part('Head', frus(0.34, 0.45, 0.17, 0.34, 0.44), 0, 1.4, -0.01, C.hair, { mesh: 'hair' });                       // calotte
  part('Head', frus(0.44, 0.4, 0.19, 0.12, 0.1), 0, 1.265, -0.205, C.hair, { mesh: 'hair' });                       // nuque
  for (const s of [-1, 1]) {
    part('Head', frus(0.09, 0.12, 0.2, 0.3, 0.3), s * 0.21, 1.31, 0.0, C.hair, { mesh: 'hair' });                  // côtés, devant les oreilles
    hk(s * 0.17, 1.305, 0.19, 0.1, 0.1, 0.07, [0.15, 0, s * 0.1], 'hairB');                                         // pattes
  }
  for (let i = 0; i < 5; i++) hk(-0.16 + i * 0.08, 1.37 - Math.abs(i - 2) * 0.008, 0.2, 0.115, 0.1, 0.06, [0.2, 0, (i - 2) * 0.07], i % 2 ? 'hair' : 'hairB');    // frange droite
  for (let i = 0; i < 4; i++) part('Head', spike(0.12, 0.06 + (i % 2) * 0.03, 0.12), -0.12 + i * 0.08, 1.5, -0.02 + (i % 2) * 0.06, C.hair, { mesh: 'hair', rot: [0.1, i, (i - 1.5) * 0.15] });   // mèches du dessus
  for (const s of [-1, 1]) part('Head', cbox(0.14, 0.017, 0.02, 0.005), s * 0.092, 1.305, 0.222, C.brow, { mesh: 'brow' });   // sourcils

  /* ── lunettes octogonales à monture claire et verres bleutés ── */
  const octRing = (R, r, depth) => { const sh = new THREE.Shape(), ho = new THREE.Path(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * R, Math.sin(a) * R); (i ? ho.lineTo : ho.moveTo).call(ho, Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); ho.closePath(); sh.holes.push(ho); return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); };
  const octDisc = (R, depth) => { const sh = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; (i ? sh.lineTo : sh.moveTo).call(sh, Math.cos(a) * R, Math.sin(a) * R); } sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); };
  for (const s of [-1, 1]) {
    part('Head', octRing(0.07, 0.054, 0.02), s * 0.084, 1.246, 0.222, C.frame, { mesh: 'frame' });
    part('Head', octDisc(0.056, 0.004), s * 0.084, 1.246, 0.232, '#aac2e8', { mesh: 'lens', glass: true });
    part('Head', cbox(0.02, 0.014, 0.17, 0.004), s * 0.158, 1.262, 0.13, C.frame, { mesh: 'frame' });          // branches
  }
  part('Head', cbox(0.03, 0.012, 0.012, 0.003), 0, 1.262, 0.232, C.frame, { mesh: 'frame' });                   // pont

  /* ── buste : tee-shirt crème, veste ouverte courte (dos, côtés, pans, col) ── */
  part('spine_02', cbox(0.27, 0.4, 0.25, 0.03), 0, 0.915, -0.03, C.tee, { mesh: 'shirt' });
  part('spine_02', cbox(0.37, 0.42, 0.06, 0.02), 0, 0.9, -0.16, C.jacket, { mesh: 'jacket' });
  for (const s of [-1, 1]) {
    part('spine_02', frus(0.075, 0.09, 0.42, 0.26, 0.28), s * 0.165, 0.9, -0.035, C.jacketD, { mesh: 'jacketD' });
    part('spine_02', frus(0.14, 0.16, 0.41, 0.07, 0.07), s * 0.12, 0.9, 0.085, C.jacket, { mesh: 'jacket', rot: [0, -s * 0.08, 0] });
    part('spine_03', frus(0.1, 0.14, 0.05, 0.1, 0.14), s * 0.09, 1.135, 0.04, C.jacket, { mesh: 'jacket', rot: [-0.25, -s * 0.5, s * 0.25] });
  }
  part('spine_03', cbox(0.38, 0.07, 0.27, 0.025), 0, 1.06, -0.03, C.jacket, { mesh: 'jacket' });
  part('spine_03', cbox(0.26, 0.04, 0.2, 0.01), 0, 1.1, -0.075, C.lining, { mesh: 'lining' });

  /* ── bassin, short cargo : deux jambes évasées, revers, poches ; badge au cordon ── */
  part('pelvis', cbox(0.4, 0.15, 0.26, 0.03), 0, 0.705, -0.02, C.pants, { mesh: 'legs' });
  part('pelvis', cbox(0.05, 0.085, 0.01, 0.003), -0.1, 0.655, 0.125, C.badge, { mesh: 'badge' });
  part('pelvis', cbox(0.012, 0.03, 0.012, 0.002), -0.1, 0.71, 0.12, '#8d9aa5', { mesh: 'clip' });
  part('pelvis', cbox(0.006, 0.12, 0.006, 0.001), -0.098, 0.67, 0.133, C.lanyard, { mesh: 'lanyard' });
  for (const s of [-1, 1]) {
    const sd = s === 1 ? 'l' : 'r';
    const hx = s * 0.135, fx = s * 0.175, yawF = -s * 0.22;            // pointe des pieds vers l'extérieur
    part('thigh_' + sd, frus(0.17, 0.2, 0.25, 0.22, 0.24), hx, 0.6, -0.02, C.pants, { mesh: 'legs' });
    part('thigh_' + sd, cbox(0.05, 0.13, 0.16, 0.012), s * 0.225, 0.56, -0.02, C.pantsL, { mesh: 'legsL' });         // poche cargo latérale
    part('thigh_' + sd, cbox(0.1, 0.1, 0.025, 0.008), hx + s * 0.02, 0.5, 0.115, C.pantsL, { mesh: 'legsL' });       // poche avant
    part('calf_' + sd, frus(0.2, 0.25, 0.19, 0.24, 0.27), hx + s * 0.014, 0.39, -0.02, C.pants, { mesh: 'legs' });
    part('calf_' + sd, frus(0.25, 0.275, 0.075, 0.27, 0.29), hx + s * 0.02, 0.305, -0.02, C.pantsL, { mesh: 'legsL' });   // revers
    part('calf_' + sd, cbox(0.1, 0.07, 0.1, 0.015), fx, 0.245, -0.03, C.skinShade, { mesh: 'skinShade' });           // cheville
    // baskets montantes (≈ 0,24 × 0,36 × 0,30 m) : semelle crème épaisse, tige rouge, bout, languette, talon sombre
    const Y = { yaw: [fx, 0.02, yawF] };
    part('foot_' + sd, cbox(0.23, 0.055, 0.37, 0.018), fx, 0.0275, 0.04, C.sole, { mesh: 'sole', ...Y });
    part('foot_' + sd, cbox(0.205, 0.2, 0.2, 0.025), fx, 0.17, -0.04, C.red, { mesh: 'red', ...Y });
    part('foot_' + sd, cbox(0.18, 0.05, 0.19, 0.015), fx, 0.285, -0.04, C.redD, { mesh: 'redD', ...Y });
    part('foot_' + sd, frus(0.18, 0.215, 0.1, 0.16, 0.2), fx, 0.105, 0.125, C.red, { mesh: 'red', ...Y });
    part('foot_' + sd, frus(0.17, 0.21, 0.09, 0.1, 0.16), fx, 0.1, 0.225, C.red, { mesh: 'red', ...Y });
    part('foot_' + sd, cbox(0.11, 0.03, 0.09, 0.01), fx, 0.158, 0.17, C.sole, { mesh: 'sole', ...Y });                // bout renforcé crème
    part('foot_' + sd, frus(0.1, 0.15, 0.16, 0.025, 0.13), fx, 0.225, 0.04, C.tongue, { mesh: 'tongue', rot: [0.5, 0, 0], ...Y });
    part('foot_' + sd, frus(0.11, 0.16, 0.1, 0.07, 0.09), fx, 0.095, -0.18, C.heel, { mesh: 'heel', ...Y });
    // chaussettes tabi (rituel du thé)
    part('foot_' + sd, cbox(0.12, 0.07, 0.26, 0.02), fx, 0.05, 0.07, '#f4f1ea', { mesh: 'tabi', ...Y });
    part('foot_' + sd, cbox(0.05, 0.05, 0.08, 0.015), fx - 0.032, 0.035, 0.21, '#f4f1ea', { mesh: 'tabi', ...Y });
    part('foot_' + sd, cbox(0.05, 0.05, 0.08, 0.015), fx + 0.032, 0.035, 0.21, '#f4f1ea', { mesh: 'tabi', ...Y });
    part('calf_' + sd, cbox(0.1, 0.17, 0.1, 0.015), fx, 0.17, -0.03, C.skin, { mesh: 'skin' });
  }

  /* ── bras : manche courte à revers sombre, avant-bras fin, main en coin (poing) ── */
  for (const s of [-1, 1]) {
    const sd = s === 1 ? 'l' : 'r';
    part('upperarm_' + sd, cbox(0.15, 0.16, 0.16, 0.035), s * 0.19, 0.995, -0.03, C.jacket, { mesh: 'jacket' });
    part('upperarm_' + sd, frus(0.17, 0.15, 0.16, 0.16, 0.15), s * 0.29, 0.995, -0.03, C.jacket, { mesh: 'jacket', rot: [0, 0, s * Math.PI / 2] });
    part('lowerarm_' + sd, frus(0.1, 0.095, 0.05, 0.155, 0.15), s * 0.385, 0.995, -0.03, C.jacketD, { mesh: 'jacketD', rot: [0, 0, s * Math.PI / 2] });
    part('lowerarm_' + sd, frus(0.11, 0.09, 0.14, 0.1, 0.085), s * 0.48, 0.995, -0.03, C.skin, { mesh: 'skin', rot: [0, 0, s * Math.PI / 2] });
    part('hand_' + sd, frus(0.14, 0.09, 0.15, 0.13, 0.1), s * 0.6, 0.995, -0.03, C.skin, { mesh: 'skin', rot: [0, 0, s * Math.PI / 2] });
    part('hand_' + sd, cbox(0.04, 0.045, 0.07, 0.01), s * 0.575, 1.035, -0.02, C.skinShade, { mesh: 'skinShade' });
  }

  /* ── maillages skinnés (un par matériau) ── */
  const meshes = [], byName = {};
  for (const [, b] of buckets) {
    const geo = mergeGeometries(b.list, false);
    const sm = new THREE.SkinnedMesh(geo, b.glass ? new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.15, transparent: true, opacity: 0.28, depthWrite: false, flatShading: true }) : new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.85, flatShading: true, emissive: b.color, emissiveIntensity: 0.22 }));
    sm.name = b.name; sm.castShadow = sm.receiveShadow = !b.glass; sm.frustumCulled = false;
    group.add(sm); meshes.push(sm); byName[b.name] = sm;
  }
  const shoeNames = ['sole', 'redD', 'red', 'tongue', 'heel'], tabi = byName.tabi;
  tabi.visible = false;
  // plaque d'expression : devant le visage
  const faces = {}; for (const k of ['neutral', 'blink', 'happy', 'amazed', 'talkA', 'talkO', 'sip']) faces[k] = faceTexture(k);
  const plateGeo = new THREE.PlaneGeometry(0.27, 0.268); plateGeo.translate(0, 1.232, 0.2215);
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
