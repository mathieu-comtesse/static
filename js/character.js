import { THREE, mat, mesh, box, cyl, sph, group, rbox, bone, rng, bake } from './kit.js';

const SKIN = '#e2b99d', TEE = '#f3efe6', SHIRT = '#a9c4e6', PANTS = '#2e3b5a';

/* Rotation : membres suspendus selon -Y ; x négatif = vers l'avant (+Z) */
export const POSES = {
  stand:   { py: 0.92, torsoX: 0, headX: 0, hipA: [0, 0.04], hipB: [0, -0.04], kneeA: 0.02, kneeB: 0.02, shA: [-0.05, 0.1], shB: [-0.05, -0.1], elA: -0.2, elB: -0.2 },
  desk:    { py: 0.56, torsoX: 0.1, headX: 0.12, hipA: [-1.4, 0.05], hipB: [-1.4, -0.05], kneeA: 1.3, kneeB: 1.3, shA: [-0.6, 0.08], shB: [-0.6, -0.08], elA: -0.9, elB: -0.9 },
  lounge:  { py: 0.5, torsoX: -0.3, headX: 0.12, hipA: [-1.2, 0.12], hipB: [-0.95, -0.08], kneeA: 0.95, kneeB: 0.35, shA: [-0.3, 0.45], shB: [-0.3, -0.45], elA: -0.7, elB: -0.7 },
  vinyl:   { py: 0.92, torsoX: 0.28, headX: 0.35, hipA: [0.05, 0.04], hipB: [-0.1, -0.04], kneeA: 0.05, kneeB: 0.1, shA: [-1.05, 0.05], shB: [-0.15, -0.55], elA: -0.55, elB: -1.5 },
  water:   { py: 0.92, torsoX: 0.12, headX: 0.25, hipA: [0, 0.04], hipB: [0, -0.04], kneeA: 0.02, kneeB: 0.02, shA: [-1.25, 0.05], shB: [-0.1, -0.2], elA: -0.45, elB: -0.3 },
  stool:   { py: 0.43, torsoX: 0.22, headX: 0.15, hipA: [-1.45, 0.12], hipB: [-1.45, -0.12], kneeA: 1.5, kneeB: 1.5, shA: [-0.55, 0.08], shB: [-0.55, -0.08], elA: -0.95, elB: -0.95 },
};

export function createCharacter() {
  const r = rng(21);
  const skin = mat(SKIN, { roughness: 0.8 }), tee = mat(TEE), shirt = mat(SHIRT), pants = mat(PANTS);
  const root = group();
  const body = group(); root.add(body);
  const J = {};  // joints

  /* bassin */
  body.add(rbox(0.36, 0.2, 0.22, 0.07, pants, 0, 0.02, 0));
  /* buste */
  const torso = group(); torso.position.y = 0.06; body.add(torso); J.torso = torso;
  torso.add(rbox(0.3, 0.54, 0.19, 0.07, tee, 0, 0.26, 0));
  torso.add(rbox(0.37, 0.54, 0.05, 0.02, shirt, 0, 0.26, -0.085));
  for (const s of [-1, 1]) {
    torso.add(rbox(0.045, 0.54, 0.2, 0.018, shirt, s * 0.175, 0.26, -0.005));
    const f = rbox(0.115, 0.52, 0.04, 0.016, shirt, s * 0.13, 0.26, 0.1); f.rotation.y = -s * 0.2; torso.add(f);
  }
  torso.add(rbox(0.2, 0.09, 0.1, 0.03, skin, 0, 0.56, 0.0));

  /* tête */
  const head = group(); head.position.set(0, 0.69, 0); torso.add(head); J.head = head;
  const skull = sph(0.125, skin, 0, 0.05, 0, 28, 20); skull.scale.set(1, 1.08, 1.02); head.add(skull);
  for (const s of [-1, 1]) head.add(sph(0.03, skin, s * 0.122, 0.04, 0, 10, 8));
  head.add(sph(0.022, mat('#d2a085'), 0, 0.03, 0.128, 10, 8));
  const eyes = group(); head.add(eyes);
  for (const s of [-1, 1]) {
    const e = group();
    e.add(sph(0.027, mat('#f6f3ee', { roughness: 0.4 }), 0, 0, 0, 14, 10));
    const iris = sph(0.0165, mat('#7fa0b4'), 0, 0, 0.016, 12, 8); e.add(iris);
    e.add(sph(0.0085, mat('#15181c'), 0, 0, 0.026, 8, 6));
    e.children.forEach((c) => (c.scale.z *= 0.7));
    e.position.set(s * 0.05, 0.072, 0.1);
    eyes.add(e);
    const brow = box(0.058, 0.013, 0.012, mat('#8c6a42'), s * 0.05, 0.113, 0.118); brow.rotation.z = -s * 0.08; head.add(brow);
  }
  /* cheveux bouclés */
  const hairG = group(); head.add(hairG);
  const hairCols = ['#a98a5c', '#8d6e46', '#c3a572', '#9c7a4e', '#b99a69'].map((c) => mat(c, { roughness: 1 }));
  const curl = (x, y, z, rr) => hairG.add(sph(rr, hairCols[(r() * 5) | 0], x, y, z, 7, 5));
  for (let i = 0; i < 150; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(1 - r() * 1.3);   // calotte
    const R = 0.126 + r() * 0.03;
    const x = Math.sin(ph) * Math.cos(th) * R, y = Math.cos(ph) * R * 1.08 + 0.05, z = Math.sin(ph) * Math.sin(th) * R;
    if (z > 0.04 && y < 0.14) continue;
    curl(x * 1.04, y, z, 0.03 + r() * 0.02);
  }
  for (let i = 0; i < 14; i++) curl((i - 6.5) * 0.019, 0.178 - Math.abs(i - 6.5) * 0.004, 0.095 + r() * 0.012, 0.026 + r() * 0.01);
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) curl(s * (0.12 + r() * 0.025), 0.045 - i * 0.017, -0.03 - r() * 0.05, 0.03 + r() * 0.012);
  for (let i = 0; i < 26; i++) curl((r() - 0.5) * 0.26, 0.02 - r() * 0.1, -0.115 - r() * 0.035, 0.033 + r() * 0.015);
  /* barbe rousse */
  const beardCols = ['#bd7a47', '#ad6a3a', '#c98b55'].map((c) => mat(c, { roughness: 1 }));
  for (let i = 0; i < 34; i++) {
    const t = (i / 33 - 0.5) * 2.6;
    const x = Math.sin(t) * 0.105, z = Math.cos(t) * 0.1 + 0.01;
    hairG.add(sph(0.032 + r() * 0.012, beardCols[(r() * 3) | 0], x, -0.055 - (1 - Math.cos(t)) * -0.02 - Math.abs(Math.sin(t)) * -0.005, z, 8, 6));
  }
  for (let i = 0; i < 8; i++) hairG.add(sph(0.035 + r() * 0.01, beardCols[(r() * 3) | 0], (i - 3.5) * 0.026, -0.1 - r() * 0.02, 0.095 + r() * 0.01, 8, 6));
  for (const s of [-1, 1]) { hairG.add(sph(0.026, beardCols[1], s * 0.022, -0.012, 0.125, 8, 6)); hairG.add(sph(0.03, beardCols[0], s * 0.1, -0.02, 0.05, 8, 6)); }
  head.add(box(0.026, 0.008, 0.01, mat('#a7604b'), 0, -0.04, 0.133));

  bake(hairG);

  /* bras */
  const mkArm = (s) => {
    const sh = group(); sh.position.set(s * 0.215, 0.5, 0); torso.add(sh);
    sh.add(sph(0.058, shirt, 0, 0, 0, 14, 10));
    sh.add(bone([0, 0, 0], [0, -0.28, 0], 0.056, 0.05, shirt, 12));
    const el = group(); el.position.y = -0.28; sh.add(el);
    el.add(sph(0.05, shirt, 0, 0, 0, 12, 8));
    el.add(bone([0, 0, 0], [0, -0.11, 0], 0.052, 0.054, shirt, 12));
    el.add(bone([0, -0.1, 0], [0, -0.27, 0], 0.045, 0.036, skin, 10));
    const hand = group(); hand.position.y = -0.3; el.add(hand);
    hand.add(sph(0.045, skin, 0, 0, 0.005, 12, 8));
    return { sh, el, hand };
  };
  const armA = mkArm(1), armB = mkArm(-1);
  J.shA = armA.sh; J.elA = armA.el; J.shB = armB.sh; J.elB = armB.el;

  /* jambes */
  const sole = mat('#f4f1ea'), upper = mat('#ee5a24'), black = mat('#1a1b1d');
  const mkLeg = (s) => {
    const hip = group(); hip.position.set(s * 0.1, 0, 0); body.add(hip);
    hip.add(sph(0.09, pants, 0, 0, 0, 12, 8));
    hip.add(bone([0, 0, 0], [0, -0.44, 0], 0.09, 0.07, pants, 12));
    const kn = group(); kn.position.y = -0.44; hip.add(kn);
    kn.add(sph(0.07, pants, 0, 0, 0, 12, 8));
    kn.add(bone([0, 0, 0], [0, -0.41, 0], 0.07, 0.056, pants, 12));
    const foot = group(); foot.position.y = -0.46; kn.add(foot);
    foot.add(rbox(0.105, 0.04, 0.27, 0.018, sole, 0, 0.0, 0.05));
    foot.add(rbox(0.1, 0.05, 0.2, 0.024, upper, 0, 0.04, 0.03));
    foot.add(rbox(0.1, 0.045, 0.07, 0.02, black, 0, 0.03, 0.14));
    return { hip, kn };
  };
  const legA = mkLeg(1), legB = mkLeg(-1);
  J.hipA = legA.hip; J.kneeA = legA.kn; J.hipB = legB.hip; J.kneeB = legB.kn;

  /* accessoire : arrosoir */
  const can = group();
  const green = mat('#3f8f6a');
  can.add(cyl(0.07, 0.07, 0.13, green, 0, 0, 0, 18));
  const spout = bone([0.05, 0.02, 0.0], [0.2, 0.1, 0.0], 0.014, 0.01, green, 8); can.add(spout);
  can.add(cyl(0.016, 0.016, 0.01, green, 0.2, 0.1, 0, 10).rotateZ(-0.9));
  can.position.set(0.0, -0.04, 0.09); can.rotation.y = 0;
  can.visible = false;
  armA.hand.add(can);

  body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const cur = {}, tgt = {};
  const flat = (p) => ({
    py: p.py, torsoX: p.torsoX, headX: p.headX,
    hipAx: p.hipA[0], hipAz: p.hipA[1], hipBx: p.hipB[0], hipBz: p.hipB[1], kneeA: p.kneeA, kneeB: p.kneeB,
    shAx: p.shA[0], shAz: p.shA[1], shBx: p.shB[0], shBz: p.shB[1], elA: p.elA, elB: p.elB,
  });
  Object.assign(cur, flat(POSES.stand)); Object.assign(tgt, cur);
  const extra = { typing: 0, water: 0, sway: 0 };
  let blink = 0, nextBlink = 2;

  function apply(t) {
    body.position.y = cur.py;
    torso.rotation.x = cur.torsoX;
    head.rotation.x = cur.headX;
    J.hipA.rotation.set(cur.hipAx, 0, cur.hipAz); J.hipB.rotation.set(cur.hipBx, 0, cur.hipBz);
    J.kneeA.rotation.x = cur.kneeA; J.kneeB.rotation.x = cur.kneeB;
    const ty = extra.typing * Math.sin(t * 16) * 0.05, ty2 = extra.typing * Math.sin(t * 16 + 2) * 0.05;
    J.shA.rotation.set(cur.shAx, 0, cur.shAz); J.shB.rotation.set(cur.shBx, 0, cur.shBz);
    J.elA.rotation.x = cur.elA + ty; J.elB.rotation.x = cur.elB + ty2;
    if (extra.water) J.shA.rotation.x = cur.shAx + Math.sin(t * 2.4) * 0.05;
  }

  return {
    root, joints: J, head, can,
    setPose(name, { instant = false, typing = false, water = false } = {}) {
      Object.assign(tgt, flat(POSES[name]));
      extra.typing = typing ? 1 : 0; extra.water = water ? 1 : 0;
      can.visible = water;
      if (instant) { Object.assign(cur, tgt); }
    },
    update(dt, t) {
      const k = 1 - Math.exp(-dt * 9);
      for (const key in tgt) cur[key] += (tgt[key] - cur[key]) * k;
      apply(t);
      torso.scale.y = 1 + Math.sin(t * 1.9) * 0.012;
      head.rotation.y = Math.sin(t * 0.6) * 0.05;
      nextBlink -= dt;
      if (nextBlink < 0) { blink = 0.14; nextBlink = 2 + Math.random() * 3; }
      blink = Math.max(0, blink - dt);
      eyes.scale.y = blink > 0 ? 0.1 : 1;
    },
  };
}
