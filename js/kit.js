import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
export { THREE };

const cache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
  cache.set(key, m);
  return m;
}

export function mesh(geo, m, x = 0, y = 0, z = 0) {
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = me.receiveShadow = true;
  return me;
}
export const box = (w, h, d, m, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
export const cyl = (rt, rb, h, m, x, y, z, seg = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
export const sph = (r, m, x, y, z, ws = 20, hs = 14) => mesh(new THREE.SphereGeometry(r, ws, hs), m, x, y, z);

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

/** Boîte à arêtes arrondies (w, h, d), centrée. */
export function rbox(w, h, d, r, m, x = 0, y = 0, z = 0) {
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const a = w / 2 - r, b = h / 2 - r, depth = Math.max(d - 2 * r, 1e-4);
  const s = new THREE.Shape();
  s.moveTo(-a, -b); s.lineTo(a, -b); s.lineTo(a, b); s.lineTo(-a, b); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  return mesh(g, m, x, y, z);
}

/** Tube lisse le long d'une courbe, embouts arrondis. */
export function tube(pts, r, m, { segs = 80, radial = 14, closed = false, caps = true } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.5);
  const g = group(mesh(new THREE.TubeGeometry(curve, segs, r, radial, closed), m));
  if (caps && !closed) for (const p of [pts[0], pts[pts.length - 1]]) g.add(sph(r, m, p[0], p[1], p[2], radial, 8));
  g.userData.curve = curve;
  return g;
}

/** Segment conique entre deux points. */
export function bone(a, b, r0, r1, m, seg = 8) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const g = new THREE.CylinderGeometry(r1, r0, len, seg);
  const me = mesh(g, m);
  me.position.copy(va).add(vb).multiplyScalar(0.5);
  me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return me;
}

/** PRNG déterministe pour que la scène soit identique à chaque chargement. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Fusionne les maillages statiques d'un groupe par matériau (moins d'appels de rendu). */
export function bake(root) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), drop = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
    drop.push(o);
  });
  for (const o of drop) o.parent.remove(o);
  for (const [m, list] of buckets) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    const me = new THREE.Mesh(merged, m);
    me.castShadow = me.receiveShadow = true;
    root.add(me);
    list.forEach((g) => g.dispose());
  }
  return root;
}
