import { THREE, group, mat, inkify, ink, contactShadow, tube, box } from './kit.js';
import * as F from './furniture.js';
import { createCharacter } from './character.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { loadBuffer } from './kit.js';
import { teaSet, shoePair, updateSteam } from './tea.js';
import { createRitual } from './ritual.js';
import { createChashitsu } from './chashitsu.js';
import { createRetroSet } from './retro.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const DEG = Math.PI / 180;
const easeOutBounce = (x) => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};

export async function createRoom(container, bubbleEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y pinch-zoom;image-rendering:pixelated';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  const hemi = new THREE.HemisphereLight('#fff7e8', '#c9b99c', 0.85);
  const sun = new THREE.DirectionalLight('#fff0dc', 2.0);
  sun.position.set(3.5, 7.5, -2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 20 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.3, color: '#3b4a73' }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  /* ─── textures ─── */
  const loader = new THREE.TextureLoader();
  const load = (url) => new Promise((res) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
  const [rugTex, paintTex, ekGltf, setuGltf, sofaGltf, jblGltf] = await Promise.all([load('assets/tapis.webp'), load('assets/tableau.jpg'), loadBuffer('assets/ekstrem.glb').then((b) => new Promise((res, rej) => new GLTFLoader().parse(b, '', res, rej))), loadBuffer('assets/setu.glb').then((b) => new Promise((res, rej) => new GLTFLoader().parse(b, '', res, rej))), loadBuffer('assets/ds450.glb').then((b) => new Promise((res, rej) => new GLTFLoader().parse(b, '', res, rej))), loadBuffer('assets/jbl.glb').then((b) => new Promise((res, rej) => new GLTFLoader().parse(b, '', res, rej)))]);

  /* ─── mobilier ─── */
  const world = group(); scene.add(world);
  const items = [];                     // { holder, obj, delay, id }
  const add = (id, obj, x, z, yaw = 0, y = 0, delay = 0, parent = world, contact = 1) => {
    const holder = group(obj);
    holder.position.set(x, y, z); holder.rotation.y = yaw;
    holder.userData.id = id;
    parent.add(holder);
    if (parent === world) {
      items.push({ holder, obj, delay, id, base: obj.position.clone() });
      if (contact) {
        holder.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(holder), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
        const sh = contactShadow(Math.min(sz.x, 2.4) * 1.35 * contact, Math.min(sz.z, 2.4) * 1.35 * contact, 0.34);
        sh.position.set(c.x, 0.003, c.z); world.add(sh); items[items.length - 1].shadow = sh;
      }
    }
    return holder;
  };

  const lamps = {};
  const mkLamp = (key, glowMat, light, onColor, offColor) => { lamps[key] = { glow: glowMat, light, on: false, onColor, offColor, k: 0 }; glowMat.color.set(offColor); };

  if (rugTex) add('rug', F.rug(rugTex, 3.1, 4.3), 0.0, 1.1, 0, 0, 0.0, world, 0);

  // bureau + objets
  const deskSet = group();
  deskSet.add(F.desk());
  const uw = F.ultrawide(); uw.position.set(-0.2, 0.74, -0.2); uw.userData.id = 'pc'; deskSet.add(uw);
  const pm = F.portraitMonitor(); pm.position.set(0.52, 0.74, -0.18); pm.rotation.y = -0.22; pm.userData.id = 'pc'; deskSet.add(pm);
  const kb = F.moonlander(); kb.position.set(-0.12, 0.74, 0.2); deskSet.add(kb);
  const mouse = F.verticalMouse(); mouse.position.set(0.3, 0.74, 0.24); mouse.rotation.y = 0.1; deskSet.add(mouse);
  const brontes = F.brontes();
  add('brontes', brontes, -0.8, -0.22, 0.4, 0.74, 0, deskSet);
  const tw = F.tower(); tw.position.set(0.8, 0.74, -0.08); tw.rotation.y = -0.12; deskSet.add(tw);
  const dcab = (pts, r = 0.0028) => deskSet.add(tube(pts.map(([x, y, z]) => [x, y + 0.74, z]), r, mat('#121214', { roughness: 0.6 }), { segs: 40, radial: 5 }));
  dcab([[0.77, 0.3, -0.3], [0.76, 0.012, -0.34], [0.62, 0.006, -0.36], [0.5, 0.006, -0.3], [0.5, 0.03, -0.2]]);
  dcab([[0.79, 0.28, -0.3], [0.78, 0.012, -0.36], [0.4, 0.006, -0.4], [0.0, 0.006, -0.36], [-0.2, 0.03, -0.28]]);
  inkify(deskSet, { skip: (o) => { if (o.geometry && o.geometry.type === 'TubeGeometry') return true; for (let p = o; p; p = p.parent) if (p.userData && p.userData.id === 'brontes') return true; return false; } });
  add('desk', deskSet, -3.1, 0.25, Math.PI / 2, 0, 0.12);
  mkLamp('brontes', brontes.userData.glow, new THREE.PointLight('#ffd9a0', 0, 3, 2), '#fff0d0', '#9a948a');

  const chair = F.officeChairFrom(setuGltf);
  add('chair', chair, -2.15, 0.3, -Math.PI / 2 + 0.15, 0, 0.2);

  const STOOL_X = 2.0, STOOL_Z = 4.55;           // tabouret à droite du canapé, portant le bonsaï
  const bonsai = F.bonsai(); inkify(bonsai, { skip: (o) => !['9b9a92'].includes(o.material.color.getHexString()) }); add('bonsai', bonsai, STOOL_X, STOOL_Z, 0.5, 0.372, 0.42);
  const sp1 = F.speakerFromGltf(jblGltf, 1.15), sp2 = F.speakerFromGltf(jblGltf, 1.15);
  const spPosts = [F.speakerPosts(sp1), F.speakerPosts(sp2)];
  const alo = F.alocasia(); inkify(alo, { skip: (o) => !(o.material.map && o.material.map.image && o.material.map.image.width === 128 && o.material.side === THREE.DoubleSide) });
  add('alocasia', alo, -3.1, 3.25, 0.6, 0, 0.9).scale.setScalar(0.9);
  add('sofa', F.sofaFrom(sofaGltf, 2.2, { recline: 0, slide: 0, lateral: 0 }), 0.35, 4.55, Math.PI, 0, 0.95);
  add('speaker1', sp1, -2.6, -2.5, 0.35, 0, 0.5);

  const EKS = 1.3;                           // l'Ekstrem est un grand fauteuil
  const ek = F.ekstremFrom(ekGltf); add('ekstrem', ek, 2.3, -0.95, -0.45, 0, 0.35).scale.setScalar(EKS);
  // pièce du thé excentrée (plate-forme de tatamis, shoji coulissants, balcon en bois, mer) ; origine du thé = zabuton de l'invité
  const CS = { x: -5.5, z: 7.3 };
  const cs = createChashitsu();
  add('chashitsu', cs.group, CS.x, CS.z, 0, 0, 0.5, world, 0);
  const TEA = { x: CS.x, z: CS.z - 0.45, y: cs.spec.RH - 0.055 };
  const tea = teaSet({ mat: false });
  add('cha', tea, TEA.x, TEA.z, 0, TEA.y, 0.6, world, 0);
  const shoes = shoePair(); inkify(shoes); add('shoes', shoes, CS.x - 0.95, CS.z + cs.spec.RD / 2 + 0.4, 0, cs.spec.DK.y + 0.02, 0.7, world, 0);
  const stool = F.stool(); add('stool', stool, STOOL_X, STOOL_Z, 0.2, 0, 0.55);

  mkLamp('andon', cs.lanternGlow, new THREE.PointLight('#ffd9a0', 0, 2.5, 2), '#ffe2a0', '#cfc8b4');
  lamps.andon.light.position.set(CS.x + cs.spec.RW / 2 - 0.15, 0.4, CS.z + cs.spec.DK.z0 + 1.05);
  world.add(lamps.andon.light);
  // télé cathodique + PS1 + manette sur le tapis, câbles au sol
  const retro = createRetroSet();
  add('tv', retro.group, -0.35, 2.0, 0, 0.018, 0.55, world, 0).scale.setScalar(1.3);
  world.updateMatrixWorld(true);
  // cordon de la multiprise : serpente sur le tapis, sort par le bord droit, passe du côté gauche (vu de l'écran) de l'étagère blanche et rejoint la prise au sol
  const cs0 = retro.group.localToWorld(retro.cordStart.clone());
  const cordPts = [[cs0.x, 0.03, cs0.z], [cs0.x + 0.22, 0.03, cs0.z - 0.16], [cs0.x + 0.5, 0.03, cs0.z + 0.04], [cs0.x + 0.78, 0.03, cs0.z + 0.35], [1.25, 0.03, 2.4], [1.52, 0.026, 2.75], [1.75, 0.01, 3.0], [2.05, 0.008, 3.12], [2.4, 0.008, 2.98], [2.75, 0.008, 3.12], [3.1, 0.008, 2.98], [3.45, 0.008, 3.1], [3.7, 0.008, 3.08]];
  const cord = tube(cordPts, 0.0105, new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.6 }), { segs: 160, radial: 6 });
  const wallPlug = group(box(0.05, 0.03, 0.04, mat('#17181a'), 3.69, 0.012, 3.08));
  const outlet = group(box(0.14, 0.012, 0.14, mat('#ecebe6', { roughness: 0.5 }), 3.82, 0.006, 3.08), box(0.02, 0.014, 0.012, mat('#222'), 3.82, 0.007, 3.05), box(0.02, 0.014, 0.012, mat('#222'), 3.82, 0.007, 3.11));
  add('strip', group(cord, wallPlug, outlet), 0, 0, 0, 0, 0.6, world, 0);
  const usmSet = group();
  usmSet.add(F.usm());
  const amp = F.amplifier(); amp.position.set(-0.37, 0.734, 0); usmSet.add(amp);
  const AMPH = 0.085;
  const tt = F.turntable(); inkify(tt, { skip: (o) => o.material.color.getHexString() !== '3f2d22' }); tt.position.set(-0.37, 0.734 + AMPH, 0); usmSet.add(tt);
  const rca = F.rcaCables(-0.37, -0.158, 0.734, 0.734 + 0.05); usmSet.add(rca);
  const cl = F.concreteLamp(); inkify(cl, { skip: (o) => o.material.vertexColors }); cl.scale.setScalar(0.6); add('beton', cl, 0.44, 0.0, 0, 0.734, 0, usmSet);
  add('usm', usmSet, -0.7, -2.4, 0, 0, 0.45);
  mkLamp('beton', cl.userData.glow, new THREE.PointLight('#ffe9c4', 0, 2.5, 2), '#fff3d6', '#8a8780');

  const ARC_YAW = -2.36;                      // le bras du lampadaire s'incline vers le tapis
  const arc = F.arcLamp();
  add('arc', arc, 0.85, -2.15, ARC_YAW, 0, 0.6, world, 0);
  mkLamp('arc', arc.userData.glow, new THREE.PointLight('#ffe0a8', 0, 6, 2), '#ffe6b0', '#8a8272');

  if (paintTex) { const pt = add('painting', F.painting(paintTex), -0.7, -2.95, 0, 1.35, 0.7, world, 0); pt.scale.setScalar(1.3); }
  const dra = F.dracaena(); inkify(dra, { skip: (o) => o.material.color.getHexString() !== 'b3a893' }); add('dracaena', dra, 2.85, -2.45, 0.3, 0, 0.65);
  add('speaker2', sp2, 1.25, -2.5, -0.35, 0, 0.75);
  const ekBox = new THREE.Box3().setFromObject(ek.parent); // ligne de l'étagère = pied le plus extérieur de l'Ekstrem
  ek.parent.updateMatrixWorld(true);
  add('shelf1', F.shelf(), ekBox.max.x - 0.04, 1.8, Math.PI / 2, 0, 0.8);

  // câbles d'enceintes : de l'arrière de l'ampli (derrière le meuble vert) jusqu'aux bornes de chaque enceinte
  { world.updateMatrixWorld(true);
    const ampPost = F.ampPosts(amp); usmSet.updateMatrixWorld(true);
    const run = (aKey, spId, spk, sp) => {
      const holder = items.find((i) => i.id === spId).holder;
      ['black', 'red'].forEach((c, ci) => {
        const A = amp.localToWorld(ampPost[aKey + c].clone());
        const S = holder.localToWorld(sp[c].clone());
        const o = ci * 0.014, zz = -2.7 - o;
        const mid = (A.x + S.x) / 2;
        const pts = [[A.x, A.y, A.z], [A.x, A.y - 0.02, A.z - 0.08], [A.x, 0.45, zz], [A.x + (S.x - A.x) * 0.15, 0.01, zz - 0.03], [mid, 0.006, zz + 0.16 + o], [S.x + (A.x - S.x) * 0.1, 0.007, zz - 0.02], [S.x, S.y * 0.3, S.z - 0.05], [S.x, S.y, S.z]];
        const t = tube(pts, 0.0045, new THREE.MeshStandardMaterial({ color: c === 'red' ? '#b32525' : '#18181a', roughness: 0.5 }), { segs: 90, radial: 5 });
        add('wire' + spId + c, t, 0, 0, 0, 0, 0.8, world, 0);
      });
    };
    run('L', 'speaker1', null, spPosts[0]); run('R', 'speaker2', null, spPosts[1]); }
  // positions des sources lumineuses (repère monde)
  const yawed = (v, yaw, ox, oz) => { v = v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); return [ox + v.x, v.y, oz + v.z]; };
  lamps.arc.light.position.set(...yawed(new THREE.Vector3(1.38, 2.05, 0), ARC_YAW, 0.85, -2.15));
  lamps.beton.light.position.set(-0.3, 1.0, -2.3);
  lamps.brontes.light.position.set(...yawed(new THREE.Vector3(-0.8, 1.15, -0.22), Math.PI / 2, -3.1, 0.25));
  for (const L of Object.values(lamps)) world.add(L.light);

  /* ─── personnage ─── */
  const hero = await createCharacter();
  hero.group.visible = false; world.add(hero.group);
  if (/[?&]squelette/.test(location.search)) scene.add(new THREE.SkeletonHelper(hero.group));
  const ritual = createRitual({ hero, tea });

  /* ─── caméra orthographique ─── */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  const view = { az: 36 * DEG, el: 26 * DEG, zoom: 1, tAz: 36 * DEG, tEl: 26 * DEG, tZoom: 1 };
  const target = new THREE.Vector3(0.1, 0.8, -0.2), tgt = target.clone(), home = target.clone();
  const DEF = { az: 36 * DEG, el: 26 * DEG, zoom: 1 };
  let fit = 1, W = 1, H = 1;

  function orient() {
    const r = 40;
    camera.position.set(
      target.x + Math.sin(view.az) * Math.cos(view.el) * r,
      target.y + Math.sin(view.el) * r,
      target.z + Math.cos(view.az) * Math.cos(view.el) * r);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
  }
  function computeFit() {
    const save = { az: view.az, el: view.el };
    view.az = DEF.az; view.el = DEF.el; orient();
    items.forEach((i) => { i.obj.position.copy(i.base); });
    world.updateMatrixWorld(true);
    const inv0 = new THREE.Box3().setFromObject(world); inv0.getCenter(target); tgt.copy(target); home.copy(target);
    orient();
    const inv = camera.matrixWorldInverse, v = new THREE.Vector3(), bb = new THREE.Box3();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const it of items) {
      bb.setFromObject(it.holder);
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        v.set(x, y, z).applyMatrix4(inv);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
    }
    const mx = Math.max(Math.abs(x0), Math.abs(x1)), my = Math.max(Math.abs(y0), Math.abs(y1)), aspect = W / H;
    // la scène doit tenir dans 94 % de la largeur et 88 % de la hauteur
    fit = Math.max(my / 0.88, mx / 0.94 / aspect);
    view.az = save.az; view.el = save.el;
  }
  function resize() {
    W = container.clientWidth || 1; H = container.clientHeight || 1;
    // rendu en basse définition (≈720 px de haut), agrandi sans lissage : même grain que la scène de référence
    const ih = Math.min(H * (window.devicePixelRatio || 1), 720), k = ih / H;
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(W * k), Math.round(ih), false);
    ink.res.value.set(Math.round(W * k), Math.round(ih));
    ink.px = Math.max(2, 3 * ih / 720); if (ink.mat) ink.mat.uniforms.uPx.value = ink.px;
    computeFit(); applyFrustum();
  }
  function applyFrustum() {
    const aspect = W / H, h = fit / view.zoom;
    camera.left = -h * aspect; camera.right = h * aspect; camera.top = h; camera.bottom = -h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);

  /* ─── interaction ─── */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickIdAt = (cx, cy) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(world, true);
    for (const h of hits) {
      let vis = true; for (let q = h.object; q; q = q.parent) if (!q.visible) { vis = false; break; }
      if (!vis) continue;
      let o = h.object;
      while (o && o !== world) { if (o.userData.id) return o.userData.id; o = o.parent; }
    }
    return null;
  };

  const pointers = new Map();
  let drag = null, pinch = 0, hovered = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null; }
  });
  el.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (p) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) view.tZoom = Math.min(2.6, Math.max(0.7, view.tZoom * (d / pinch)));
        pinch = d;
      } else if (drag) {
        drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.moved > 6) {
          view.tAz -= dx * 0.006;
          view.tEl = Math.min(58 * DEG, Math.max(14 * DEG, view.tEl + dy * 0.004));
          el.style.cursor = 'grabbing';
        }
      }
    } else {
      const id = pickIdAt(e.clientX, e.clientY);
      if (id !== hovered) { hovered = id; el.style.cursor = id ? 'pointer' : 'grab'; }
    }
  });
  const up = (e) => {
    pointers.delete(e.pointerId); pinch = 0;
    if (drag && drag.moved <= 6 && performance.now() - drag.t < 500) {
      const id = pickIdAt(e.clientX, e.clientY);
      if (id) activate(id);
    }
    drag = null; el.style.cursor = hovered ? 'pointer' : 'grab';
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return;     // la molette normale fait défiler la page
    e.preventDefault();
    view.tZoom = Math.min(2.6, Math.max(0.7, view.tZoom * Math.exp(-e.deltaY * 0.0015)));
  }, { passive: false });
  el.addEventListener('dblclick', () => { view.tAz = DEF.az; view.tEl = DEF.el; view.tZoom = 1; });
  el.style.cursor = 'grab';

  /* ─── stations du personnage ─── */
  const seat = (x, z, yaw, back) => { const v = new THREE.Vector3(0, 0, back).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); return [x + v.x, 0, z + v.z]; };
  const deskYaw = -Math.PI / 2 + 0.15, ekYaw = -0.45;
  const stations = {
    desk:     { label: 'Au bureau',        clip: 'Driving_Loop',        y: 0.13, face: 'neutral', pos: seat(-2.15, 0.3, deskYaw, -0.06), yaw: deskYaw },
    ekstrem:  { label: 'Dans le fauteuil', clip: 'Sitting_Idle_Loop',   y: 0.46, face: 'happy',   pos: seat(2.3, -0.95, ekYaw, -0.14), yaw: ekYaw },
    usm:      { label: 'Un vinyle',        clip: 'Idle_Loop',           y: 0.0, face: 'happy',   ov: { lean: 0.3, armR: -0.95, foreR: -0.35, armL: -0.2, head: 0.25 }, pos: [-1.0, 0, -1.7], yaw: Math.PI, music: true },
    alocasia: { label: 'J\u2019arrose l\u2019alocasia', clip: 'Idle_Loop', y: 0.0, face: 'neutral', can: true, ov: { lean: 0.08, armR: -1.3, foreR: -0.4, head: 0.2 }, pos: [-2.0, 0, 3.25], yaw: -1.57 },
    cha:      { label: 'Cérémonie du thé', ritual: true, y: TEA.y + 0.125, pos: [TEA.x, 0, TEA.z], yaw: 0 },
    bonsai:   { label: 'J\u2019arrose le bonsaï', clip: 'Idle_Loop', y: 0.0, face: 'neutral', can: true, ov: { lean: 0.08, armR: -1.3, foreR: -0.4, head: 0.2 }, pos: [2.85, 0, 4.55], yaw: -1.57 },
    dracaena: { label: 'J\u2019arrose la plante', clip: 'Idle_Loop', y: 0.0, face: 'neutral', can: true, ov: { lean: 0.08, armR: -1.3, foreR: -0.4, head: 0.2 }, pos: [2.45, 0, -1.55], yaw: 2.3 },
  };
  stations.chair = stations.desk; stations.stool = stations.bonsai; stations.shoes = stations.cha; stations.chashitsu = stations.cha;

  let music = false, current = null, bubbleT = 0;
  const speakers = ['speaker1', 'speaker2'].map((id) => items.find((i) => i.id === id));
  const record = tt.userData.record, arm = tt.userData.arm;
  let armAng = 0.5;

  /* fumée d'apparition */
  const puffs = [];
  const puffMat = new THREE.MeshBasicMaterial({ color: '#f4f6fb', transparent: true, depthWrite: false });
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), puffMat.clone()); m.visible = false; world.add(m); puffs.push({ m, t: 1, v: new THREE.Vector3() }); }
  function poof(pos) {
    puffs.forEach((p, i) => {
      p.t = -i * 0.03;
      const a = Math.random() * 6.28, r = 0.15 + Math.random() * 0.35;
      p.m.position.set(pos.x + Math.cos(a) * r, 0.12 + Math.random() * 0.9, pos.z + Math.sin(a) * r);
      p.s = 0.14 + Math.random() * 0.14;
    });
  }

  let appOpen = false;
  function openApp(kind, pos, zoom) {
    if (appOpen) return; appOpen = true; leave();
    tgt.copy(pos); view.tZoom = zoom;
    setTimeout(() => window.dispatchEvent(new CustomEvent('room-open', { detail: { kind } })), 750);
  }
  window.addEventListener('room-close', (e) => {
    appOpen = false; tgt.copy(home); view.tZoom = 1;
    if (e.detail && e.detail.kind === 'retro') retro.powerOff();
  });
  function activate(id) {
    if (id === 'tv') {
      if (retro.state === 'off') retro.powerOn();
      else if (retro.state === 'ready') openApp('retro', retro.group.localToWorld(retro.tvCenter.clone()), 5.2);
      return;
    }
    if (id === 'strip') { retro.setStrip(!retro.stripOn); return; }
    if (id === 'pc') { leave(); openApp('xp', uw.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.22, 0)), 5.2); return; }
    if (/^shoji\d$/.test(id)) { cs.togglePanel(+id.slice(5)); return; }
    if (lamps[id]) { lamps[id].on = !lamps[id].on; lamps[id].manual = true; return; }
    if (id === 'speaker1' || id === 'speaker2') { music = !music; return; }
    const st = stations[id];
    if (!st) return;
    if (current === st) { leave(); return; }
    const pos = new THREE.Vector3(st.pos[0], st.y || 0, st.pos[2]);
    if (hero.group.visible) poof(hero.group.position);
    hero.group.position.copy(pos);
    hero.group.rotation.y = st.yaw;
    ritual.stop(); hero.setPost(null); hero.setShoes(true);
    if (st.ritual) { cs.setPanels(1); hero.group.visible = true; ritual.start(); }
    else hero.play(st.clip, { fade: 0.01 });
    if (!st.ritual) hero.setBase(st.face); hero.talk(!!st.talk); hero.can.visible = !!st.can; hero.setOverride(st.ov || null);
    hero.flash('amazed', 0.6);
    hero.group.visible = true;
    hero.group.scale.setScalar(0.01);
    poof(pos);
    current = st; bubbleT = 0;
    bubbleEl.textContent = st.label;
    if (st.music) music = true;
    rain.active = !!st.can;
  }
  function leave() {
    if (!hero.group.visible) return;
    ritual.stop(); poof(hero.group.position); hero.group.visible = false; current = null; bubbleEl.classList.remove('show'); rain.active = false;
  }

  /* gouttes d'arrosage */
  const rain = { active: false, origin: new THREE.Vector3(), drops: [] };
  const dropM = new THREE.MeshBasicMaterial({ color: '#6fb6e8' });
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), dropM); m.visible = false; world.add(m); rain.drops.push({ m, t: Math.random() }); }

  /* ─── jour / nuit ─── */
  let night = false;
  function applyTheme() {
    const th = document.documentElement.dataset.theme;
    night = th ? th === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    hemi.intensity = night ? 0.5 : 0.85; hemi.color.set(night ? '#9db4e0' : '#fff7e8'); hemi.groundColor.set(night ? '#2a3350' : '#cdbfa5');
    sun.intensity = night ? 0.55 : 2.0; sun.color.set(night ? '#a9bde8' : '#fff0dc');
    scene.environmentIntensity = night ? 0.12 : 0.22;
    ground.material.opacity = night ? 0.35 : 0.22;
    for (const k in lamps) if (!lamps[k].manual) lamps[k].on = night;
  }
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  applyTheme();

  /* ─── boucle ─── */
  const opts = { dtCap: 0.05 };
  const clock = new THREE.Clock();
  let running = true;
  const startAt = performance.now();
  const v3 = new THREE.Vector3();
  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), opts.dtCap);
    const t = clock.elapsedTime;
    // entrée en cascade
    const since = (performance.now() - startAt) / 1000;
    for (const it of items) {
      const p = Math.min(1, Math.max(0, (since - it.delay) / 0.85));
      it.holder.visible = since >= it.delay;
      const k = easeOutBounce(p);
      it.obj.position.y = it.base.y + (1 - k) * 2.2;
      const sq = p < 1 ? 1 + Math.sin(p * Math.PI) * 0.0 : 1;
      it.obj.scale.setScalar(sq);
    }
    // vue
    const kv = 1 - Math.exp(-dt * 10);
    target.lerp(tgt, kv);
    view.az += (view.tAz - view.az) * kv; view.el += (view.tEl - view.el) * kv; view.zoom += (view.tZoom - view.zoom) * kv;
    orient(); applyFrustum();
    // personnage
    if (ritual.state.active) ritual.update(dt);
    cs.update(dt, t, night); retro.update(dt);
    // vapeur du bol et de la kama
    { const ud = tea.userData; ud.sBowl.position.copy(ritual.object.position).y += 0.075; ud.sKama.position.copy(ud.fk.position).add(ud.fk.userData.steamAnchor);
      const drunk = ud.bowl.userData.tea.visible ? 1 : 0; updateSteam(ud.sBowl, t, 0.3, 0.1, drunk); updateSteam(ud.sKama, t + 1.3, 0.34, 0.13, 0.8); }
    if (hero.group.visible) {
      hero.update(dt, t);
      const s = hero.group.scale.x; hero.group.scale.setScalar(s + (1 - s) * (1 - Math.exp(-dt * 10)));
      bubbleT += dt;
      if (bubbleT > 0.35) bubbleEl.classList.add('show');
      v3.set(0, 0, 0); hero.head.getWorldPosition(v3); v3.y += 0.5;
      v3.project(camera);
      bubbleEl.style.transform = `translate(${((v3.x + 1) / 2) * W}px, ${((1 - v3.y) / 2) * H}px) translate(-50%, -100%)`;
    }
    for (const p of puffs) {
      p.t += dt * 1.6;
      const on = p.t > 0 && p.t < 1;
      p.m.visible = on;
      if (on) { const k = Math.sin(Math.min(1, p.t) * Math.PI); p.m.scale.setScalar(p.s * (0.4 + p.t * 2.2)); p.m.material.opacity = 0.92 * (1 - p.t * p.t); p.m.position.y += dt * 0.25 * k; }
    }
    // pluie
    for (const d of rain.drops) {
      d.m.visible = rain.active;
      if (!rain.active) continue;
      d.t = (d.t + dt * 1.3) % 1;
      if (d.t < dt * 1.3 + 1e-3 || !d.o) { hero.canTip.getWorldPosition(rain.origin); d.o = rain.origin.clone(); }
      d.m.position.set(d.o.x + Math.sin(d.t * 40) * 0.015, d.o.y - d.t * d.t * 0.85, d.o.z + Math.cos(d.t * 33) * 0.015 + d.t * 0.1);
    }
    // musique
    record.rotation.y += dt * (music ? 3.4 : 0);
    armAng += ((music ? 0.0 : 0.5) - armAng) * (1 - Math.exp(-dt * 3));
    arm.rotation.y = armAng;
    for (const s of speakers) { const b = music ? 1 + Math.max(0, Math.sin(t * 9)) * 0.03 : 1; s.obj.scale.set(1, b, 1); }
    // lampes
    for (const k in lamps) {
      const L = lamps[k];
      L.k += ((L.on ? 1 : 0) - L.k) * (1 - Math.exp(-dt * 8));
      L.glow.color.set(L.offColor).lerp(new THREE.Color(L.onColor), L.k);
      L.light.intensity = L.k * (k === 'arc' ? 14 : k === 'beton' ? 1.6 : 1.1);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);

  // économie : on arrête quand l'onglet est caché ou le composant hors écran
  const io = new IntersectionObserver(([e]) => { const vis = e.isIntersecting && !document.hidden; if (vis && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } else if (!vis) running = false; });
  io.observe(container);
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } });

  return { activate, leave, lamps, view, target: tgt, opts, hero, ritual, tea, cs, scene, camera, renderer };
}
