import { THREE, mat, rng, rboxGeo, loadBuffer } from './kit.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

/* Personnage cubique à la manière du « Shupi » de shujaat.info :
 *  - un vrai squelette (mêmes os que le rig de ton dépôt : pelvis, spine_01..03, clavicules, bras, cuisses, pieds),
 *  - des pièces séparées et rigides : tête, plaque d'expression, cheveux, barbe, tee-shirt, veste, bras, jambes, chaussures, badge,
 *  - les animations viennent de la bibliothèque anims.glb de ton dépôt. */

const C = {
  skin: '#e6bc9b', hairA: '#a98a5c', hairB: '#8d6e46', hairC: '#c3a572', hairD: '#9c7a4e', beard: '#bd7a47',
  tee: '#fcfae2', jacket: '#8aa5d1', pants: '#1c2542', belt: '#14161a', sole: '#f4f1ea', upper: '#ee5a24', toe: '#1a1b1d',
};

/* ─── plaque d'expression : décalcomanies en pixels, comme les « face_*.png » du modèle de référence ─── */
const FW = 40, FH = 42;
function faceTexture(kind) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const r = rng(3);
  px(0, 0, FW, FH, C.skin);
  // barbe : joues + menton + moustache
  for (let y = 22; y < FH; y++) for (let x = 0; x < FW; x++) {
    const side = x < 6 || x > FW - 7, low = y > 26;
    if ((side && y > 19) || low) px(x, y, 1, 1, r() > 0.78 ? '#c98b55' : r() > 0.7 ? '#ad6a3a' : C.beard);
  }
  px(10, 24, 20, 3, '#ad6a3a');
  px(17, 19, 6, 5, '#d6a283'); px(18, 24, 4, 1, '#d6a283');                      // nez
  const eye = (cx, closed) => {
    if (closed) { px(cx - 4, 16, 9, 1, '#3d2c1c'); return; }
    const big = kind === 'amazed' ? 2 : 0;
    px(cx - 4, 13 - big, 9, 7 + big * 2, '#f7f4ee');
    px(cx - 2, 14 - big, 5, 5 + big, '#7fa0b4'); px(cx - 1, 15 - big, 3, 3 + big, '#15181c'); px(cx, 14 - big, 1, 1, '#ffffff');
  };
  const closed = kind === 'blink' || kind === 'happy';
  if (kind === 'happy') { for (const cx of [10, 29]) { px(cx - 3, 17, 7, 1, '#3d2c1c'); px(cx - 4, 18, 2, 1, '#3d2c1c'); px(cx + 3, 18, 2, 1, '#3d2c1c'); } }
  else { eye(10, closed); eye(29, closed); }
  const brow = (x0, tilt) => { for (let i = 0; i < 9; i++) px(x0 + i, 10 + tilt(i) - (kind === 'amazed' ? 2 : 0), 1, 2, '#7a5a36'); };
  brow(6, (i) => (kind === 'happy' ? 0 : i < 4 ? 1 : 0)); brow(25, (i) => (kind === 'happy' ? 0 : i > 4 ? 1 : 0));
  const mouth = {
    neutral: () => px(15, 31, 10, 2, '#7a3b32'),
    blink: () => px(15, 31, 10, 2, '#7a3b32'),
    happy: () => { px(13, 30, 14, 4, '#7a3b32'); px(14, 30, 12, 1, '#fbf6ee'); },
    amazed: () => { px(16, 29, 8, 7, '#5a2a26'); px(17, 30, 6, 5, '#7a3b32'); },
    talkA: () => { px(14, 30, 12, 5, '#5a2a26'); px(15, 31, 10, 1, '#fbf6ee'); },
    talkO: () => { px(17, 30, 6, 5, '#5a2a26'); },
  }[kind] || (() => {});
  mouth();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

export async function createCharacter({ rigUrl = 'assets/rig.json', animsUrl = 'assets/anims.glb' } = {}) {
  const rig = JSON.parse(new TextDecoder().decode(await loadBuffer(rigUrl)));
  const animBuf = await loadBuffer(animsUrl);
  const gltf = await new Promise((res, rej) => new GLTFLoader().parse(animBuf, '', res, rej));

  /* ── squelette ── */
  const group = new THREE.Group();
  const bones = {}, list = [];
  for (const b of rig) {
    const bone = new THREE.Bone(); bone.name = b.n;
    bone.position.fromArray(b.pos); bone.quaternion.fromArray(b.q);
    bones[b.n] = bone; list.push(bone);
    if (b.p) bones[b.p].add(bone);
  }
  const rootBone = bones.root; group.add(rootBone);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(list);
  const idx = Object.fromEntries(rig.map((b, i) => [b.n, i]));

  /* ── pièces rigides cubiques, liées chacune à un os ── */
  const buckets = new Map();
  const part = (bone, w, h, d, x, y, z, color, o = {}) => {
    const geo = rboxGeo(w, h, d, o.r ?? 0.025);
    if (o.rot) geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...o.rot)));
    geo.translate(x, y, z);
    const n = geo.attributes.position.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = idx[bone]; sw[i * 4] = 1; }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    const key = o.mesh || color;
    if (!buckets.has(key)) buckets.set(key, { color, list: [], name: o.mesh || color });
    buckets.get(key).list.push(geo);
  };
  const rr = rng(8);
  const jit = (a) => (rr() - 0.5) * a;

  // tête, oreilles, cou
  part('Head', 0.30, 0.31, 0.29, 0, 2.03, 0.02, C.skin, { r: 0.035, mesh: 'skin' });
  for (const s of [-1, 1]) part('Head', 0.03, 0.07, 0.05, s * 0.157, 2.02, 0.02, C.skin, { r: 0.01, mesh: 'skin' });
  part('neck_01', 0.11, 0.12, 0.11, 0, 1.86, 0, C.skin, { r: 0.02, mesh: 'skin' });
  // barbe (volumes autour de la plaque)
  part('Head', 0.28, 0.1, 0.12, 0, 1.915, 0.155, C.beard, { r: 0.03, mesh: 'beard' });
  for (const s of [-1, 1]) part('Head', 0.05, 0.14, 0.2, s * 0.15, 1.97, 0.06, C.beard, { r: 0.02, mesh: 'beard' });
  part('Head', 0.2, 0.05, 0.1, 0, 1.87, 0.1, C.beard, { r: 0.02, mesh: 'beard' });
  // cheveux bouclés en cubes : calotte, nuque, côtés, frange
  const hairCols = [C.hairA, C.hairB, C.hairC, C.hairD];
  const curl = (x, y, z, s) => { const ci = (rr() * 4) | 0; part('Head', s, s * (0.85 + rr() * 0.3), s, x, y, z, hairCols[ci], { r: s * 0.22, rot: [jit(0.7), jit(0.7), jit(0.7)], mesh: 'hair' + ci }); };
  for (let ix = -2; ix <= 2; ix++) for (let iz = -2; iz <= 2; iz++) { if (Math.abs(ix) === 2 && Math.abs(iz) === 2) continue; curl(ix * 0.075 + jit(0.02), 2.2 + jit(0.03) - (Math.abs(ix) + Math.abs(iz)) * 0.012, iz * 0.075 + 0.0 + jit(0.02), 0.115 + rr() * 0.03); }
  for (let i = 0; i < 9; i++) curl(-0.14 + i * 0.035 + jit(0.01), 2.1 + jit(0.04), -0.15 - rr() * 0.03, 0.1 + rr() * 0.03);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) curl(s * (0.155 + rr() * 0.02), 2.12 - i * 0.045, -0.04 - i * 0.05, 0.085 + rr() * 0.03);
  for (let i = 0; i < 7; i++) curl(-0.12 + i * 0.04 + jit(0.01), 2.19 + jit(0.01), 0.15 + jit(0.02), 0.075 + rr() * 0.025);   // frange
  for (const s of [-1, 1]) curl(s * 0.12, 2.17, 0.14, 0.07);

  // buste : tee-shirt, veste ouverte
  part('spine_02', 0.30, 0.56, 0.19, 0, 1.46, 0, C.tee, { r: 0.05, mesh: 'shirt' });
  part('spine_02', 0.42, 0.56, 0.07, 0, 1.47, -0.1, C.jacket, { r: 0.03, mesh: 'jacket' });
  for (const s of [-1, 1]) {
    part('spine_02', 0.12, 0.54, 0.06, s * 0.14, 1.45, 0.115, C.jacket, { r: 0.025, rot: [0, -s * 0.12, 0], mesh: 'jacket' });
    part('spine_02', 0.05, 0.54, 0.22, s * 0.195, 1.46, 0, C.jacket, { r: 0.02, mesh: 'jacket' });
    part('spine_03', 0.07, 0.05, 0.05, s * 0.075, 1.8, 0.1, C.jacket, { r: 0.01, mesh: 'jacket' });
  }
  part('spine_03', 0.46, 0.11, 0.23, 0, 1.755, -0.005, C.jacket, { r: 0.04, mesh: 'jacket' });

  // bassin, ceinture, badge
  part('pelvis', 0.37, 0.24, 0.25, 0, 1.08, 0, C.pants, { r: 0.04, mesh: 'legs' });
  part('pelvis', 0.38, 0.045, 0.26, 0, 1.2, 0, C.belt, { r: 0.012, mesh: 'belt' });
  part('pelvis', 0.052, 0.08, 0.012, -0.14, 1.03, 0.128, '#f2f0e8', { r: 0.004, mesh: 'badge' });
  part('pelvis', 0.052, 0.022, 0.014, -0.14, 1.055, 0.13, '#c3002f', { r: 0.003, mesh: 'badgeRed' });

  // membres
  for (const s of [-1, 1]) {
    const sd = s === 1 ? 'l' : 'r';
    // jambes
    part('thigh_' + sd, 0.175, 0.47, 0.21, s * 0.16, 0.9, 0.03, C.pants, { r: 0.04, mesh: 'legs' });
    part('calf_' + sd, 0.145, 0.5, 0.17, s * 0.16, 0.44, 0.02, C.pants, { r: 0.035, mesh: 'legs' });
    // chaussures
    part('foot_' + sd, 0.125, 0.045, 0.31, s * 0.16, 0.025, 0.09, C.sole, { r: 0.018, mesh: 'sole' });
    part('foot_' + sd, 0.115, 0.085, 0.2, s * 0.16, 0.095, 0.045, C.upper, { r: 0.03, mesh: 'upper' });
    part('foot_' + sd, 0.115, 0.075, 0.09, s * 0.16, 0.085, 0.2, C.toe, { r: 0.03, mesh: 'toe' });
    part('foot_' + sd, 0.12, 0.12, 0.12, s * 0.16, 0.155, -0.03, C.sole, { r: 0.03, mesh: 'sole' });
    // bras : épaule, manche, avant-bras (manche retroussée), main cubique
    part('upperarm_' + sd, 0.15, 0.15, 0.15, s * 0.2, 1.74, -0.05, C.jacket, { r: 0.04, mesh: 'jacket' });
    part('upperarm_' + sd, 0.37, 0.135, 0.135, s * 0.4, 1.74, -0.07, C.jacket, { r: 0.04, mesh: 'jacket' });
    part('lowerarm_' + sd, 0.13, 0.12, 0.12, s * 0.63, 1.74, -0.075, C.jacket, { r: 0.035, mesh: 'jacket' });
    part('lowerarm_' + sd, 0.22, 0.098, 0.098, s * 0.8, 1.74, -0.075, C.skin, { r: 0.03, mesh: 'skin' });
    part('hand_' + sd, 0.105, 0.095, 0.11, s * 0.97, 1.74, -0.07, C.skin, { r: 0.03, mesh: 'skin' });
  }

  /* ── maillages skinnés (un par matériau) ── */
  const meshes = [];
  for (const [, b] of buckets) {
    const geo = mergeGeometries(b.list, false);
    const sm = new THREE.SkinnedMesh(geo, mat(b.color, { roughness: 0.85 }));
    sm.name = b.name; sm.castShadow = sm.receiveShadow = true; sm.frustumCulled = false;
    group.add(sm); meshes.push(sm);
  }
  // plaque d'expression (devant le visage)
  const faces = {}; for (const k of ['neutral', 'blink', 'happy', 'amazed', 'talkA', 'talkO']) faces[k] = faceTexture(k);
  const plateGeo = new THREE.PlaneGeometry(0.27, 0.283); plateGeo.translate(0, 2.0, 0.1655);
  { const n = plateGeo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = idx.Head; sw[i * 4] = 1; } plateGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); plateGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); }
  const plateMat = new THREE.MeshStandardMaterial({ map: faces.neutral, roughness: 0.9 });
  const plate = new THREE.SkinnedMesh(plateGeo, plateMat); plate.name = 'expression_plate'; plate.frustumCulled = false; plate.receiveShadow = true;
  group.add(plate); meshes.push(plate);
  group.updateMatrixWorld(true);
  for (const m of meshes) m.bind(skeleton, new THREE.Matrix4());
  group.scale.setScalar(0.92);

  /* ── animations de ton dépôt (anims.glb) ── */
  const mixer = new THREE.AnimationMixer(group);
  const clips = Object.fromEntries(gltf.animations.map((a) => [a.name, a]));
  let action = null;

  /* ── accessoire : arrosoir tenu à la main (orienté dans le repère du personnage, pas de l'os) ── */
  const can = new THREE.Group(), canTip = new THREE.Object3D();
  { const green = mat('#3f8f6a'), inner = new THREE.Group();
    const body = new THREE.Mesh(rboxGeo(0.15, 0.14, 0.15, 0.03), green); body.castShadow = true;
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.24, 8), green); spout.rotation.z = -1.05; spout.position.set(0.17, 0.07, 0); spout.castShadow = true;
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.03, 10), green); rose.rotation.z = -1.05; rose.position.set(0.275, 0.124, 0);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.011, 6, 14, Math.PI), green); handle.position.set(-0.03, 0.09, 0); handle.rotation.z = 0; handle.castShadow = true;
    inner.add(body, spout, rose, handle); inner.rotation.y = -Math.PI / 2;     // bec vers l'avant (+z)
    canTip.position.set(0.3, 0.14, 0); inner.add(canTip);
    can.add(inner); can.visible = false; group.add(can); }
  const _pq = new THREE.Quaternion(), _qg = new THREE.Quaternion(), _R = new THREE.Quaternion(), _M = new THREE.Quaternion(), _v = new THREE.Vector3(), _ax = new THREE.Vector3(1, 0, 0);
  const rotChar = (bone, ang) => {       // rotation autour de l'axe latéral du personnage
    bone.parent.getWorldQuaternion(_pq); group.getWorldQuaternion(_qg);
    _R.setFromAxisAngle(_ax, ang);
    _M.copy(_pq).invert().multiply(_qg).multiply(_R).multiply(_qg.clone().invert()).multiply(_pq);
    bone.quaternion.premultiply(_M); group.updateMatrixWorld(true);
  };
  let ov = null, ovW = 0;

  /* ── expressions ── */
  let base = 'neutral', blink = 0, nextBlink = 2, flash = 0, flashKind = null, talk = false;
  const setFace = (kind) => { if (plateMat.map !== faces[kind]) { plateMat.map = faces[kind]; } };

  return {
    group, bones, skeleton, can, canTip, head: bones.Head, clips: Object.keys(clips),
    play(name, { fade = 0.25, speed = 1 } = {}) {
      const clip = clips[name]; if (!clip) return;
      const next = mixer.clipAction(clip); next.setEffectiveTimeScale(speed); next.reset().fadeIn(fade).play();
      if (action && action !== next) action.fadeOut(fade);
      action = next;
    },
    setBase(kind) { base = kind; },
    setOverride(o) { ov = o; if (o) ovW = 0; },
    flash(kind, secs = 0.7) { flashKind = kind; flash = secs; },
    talk(on) { talk = on; },
    update(dt, t) {
      mixer.update(dt);
      if (ov) {
        ovW += (1 - ovW) * (1 - Math.exp(-dt * 7));
        group.updateMatrixWorld(true);
        if (ov.lean) for (const n of ['spine_01', 'spine_02', 'spine_03']) rotChar(bones[n], ov.lean * ovW / 3);
        if (ov.armR) rotChar(bones.upperarm_r, ov.armR * ovW);
        if (ov.foreR) rotChar(bones.lowerarm_r, ov.foreR * ovW);
        if (ov.armL) rotChar(bones.upperarm_l, ov.armL * ovW);
        if (ov.foreL) rotChar(bones.lowerarm_l, ov.foreL * ovW);
        if (ov.head) rotChar(bones.Head, ov.head * ovW);
      }
      if (can.visible) {
        group.updateMatrixWorld(true);
        bones.hand_r.getWorldPosition(_v);
        group.getWorldQuaternion(_qg);
        can.position.copy(group.worldToLocal(_v)); can.position.y -= 0.02; can.position.z += 0.07;
        can.quaternion.identity();
        const wob = Math.sin(t * 2.4) * 0.05; can.rotation.z = -0.35 - wob;
      }
      nextBlink -= dt;
      if (nextBlink < 0) { blink = 0.13; nextBlink = 2 + Math.random() * 3.2; }
      blink = Math.max(0, blink - dt); flash = Math.max(0, flash - dt);
      let k = base;
      if (flash > 0) k = flashKind;
      else if (talk) k = Math.sin(t * 11) > 0.2 ? 'talkA' : Math.sin(t * 7) > 0 ? 'talkO' : base;
      else if (blink > 0 && base !== 'happy') k = 'blink';
      setFace(k);
    },
  };
}
