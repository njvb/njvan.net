// Tavren's signature moment, built from the game's own KayKit tiles (CC0, Kay
// Lousberg) and its look: hex maths, terrain dressing, warm lighting and the
// gold highlight ring all follow ~/Projects/tavren/src/scene.
//
// The moment's progress p (0 to 1) comes from src/lib/moments.ts:
//   flat    you look straight down on a flat hex map
//   tilt    the camera tilts to the board's three-quarter view
//   rise    hexes extrude in a ripple from the centre, the water ring last
//   dress   forests, quarries, pastures and fields grow in
//   light   a village drops onto the centre and the gold ring lights under it
// It renders only when p or the size changes; nothing loops.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { onMoment } from '../lib/moments';
import { TAVREN } from '../lib/motion';

const BASE = `${import.meta.env.BASE_URL}assets/kaykit/`;
const TEXTURE = `${BASE}hexagons_medieval.png`;

const PATHS = {
  grass: 'tiles/base/hex_grass.gltf',
  water: 'tiles/base/hex_water.gltf',
  grain: 'buildings/neutral/building_grain.gltf',
  forestA: 'decoration/nature/trees_A_medium.gltf',
  forestB: 'decoration/nature/trees_B_large.gltf',
  forestC: 'decoration/nature/trees_A_large.gltf',
  forestD: 'decoration/nature/trees_B_medium.gltf',
  quarryA: 'decoration/nature/mountain_A.gltf',
  quarryB: 'decoration/nature/mountain_B.gltf',
  quarryC: 'decoration/nature/mountain_C.gltf',
  pastureA: 'decoration/nature/hills_A.gltf',
  pastureB: 'decoration/nature/hills_B.gltf',
  pastureC: 'decoration/nature/hills_C.gltf',
  treeA: 'decoration/nature/tree_single_A.gltf',
  treeB: 'decoration/nature/tree_single_B.gltf',
  rockA: 'decoration/nature/rock_single_A.gltf',
  rockC: 'decoration/nature/rock_single_C.gltf',
  villageRed: 'buildings/red/building_home_A_red.gltf',
  villageBlue: 'buildings/blue/building_home_A_blue.gltf',
  townGreen: 'buildings/green/building_home_B_green.gltf',
} as const;
type Key = keyof typeof PATHS;

/* ---------- Hex maths (Tavren's: pointy-top, axial q/r) ---------- */

const HEX_SIZE = 2 / Math.sqrt(3);
type Axial = { q: number; r: number };
const center = ({ q, r }: Axial) => ({ x: HEX_SIZE * Math.sqrt(3) * (q + r / 2), z: HEX_SIZE * 1.5 * r });
const corner = (h: Axial, c: number) => {
  const p = center(h);
  const a = ((30 + 60 * c) * Math.PI) / 180;
  return { x: p.x + HEX_SIZE * Math.cos(a), z: p.z + HEX_SIZE * Math.sin(a) };
};
const ringOf = ({ q, r }: Axial) => Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
/** Small stable hash, so the dressing is the same on every visit. */
const hash = (q: number, r: number, salt = 0) => {
  const s = Math.sin(q * 127.1 + r * 311.7 + salt * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

type Terrain = 'timber' | 'stone' | 'wool' | 'grain' | 'plain';
/** The island: radius-2 land in a balanced mix, ringed by water. */
const TERRAIN: Record<string, Terrain> = {
  '0,0': 'plain',
  '1,-1': 'timber', '1,0': 'grain', '0,1': 'wool', '-1,1': 'stone', '-1,0': 'grain', '0,-1': 'timber',
  '2,-2': 'wool', '2,-1': 'timber', '2,0': 'stone', '1,1': 'grain', '0,2': 'wool', '-1,2': 'timber',
  '-2,2': 'grain', '-2,1': 'stone', '-2,0': 'wool', '-1,-1': 'timber', '0,-2': 'grain', '1,-2': 'wool',
};
const LAND_RADIUS = 2;
const SEA_RADIUS = 3;

/* ---------- Easing ---------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------- Loading ---------- */

async function loadLibrary(): Promise<Map<Key, THREE.Object3D>> {
  const manager = new THREE.LoadingManager();
  // Every model points at a texture beside it; there is one copy, at the root.
  manager.setURLModifier((url) => (url.endsWith('hexagons_medieval.png') ? TEXTURE : url));
  const loader = new GLTFLoader(manager);
  const keys = Object.keys(PATHS) as Key[];
  const scenes = await Promise.all(keys.map((k) => loader.loadAsync(BASE + PATHS[k]).then((g) => g.scene)));

  // One material for the whole pack: the models share a single palette texture,
  // so one GPU upload instead of twenty.
  let shared: THREE.MeshStandardMaterial | null = null;
  const library = new Map<Key, THREE.Object3D>();
  scenes.forEach((scene, i) => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!shared) shared = mat;
      else if (mat !== shared) {
        mat.map?.dispose();
        mat.dispose();
        mesh.material = shared;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    library.set(keys[i]!, scene);
  });
  return library;
}

/* ---------- The board ---------- */

type Piece = { obj: THREE.Object3D; delay: number; scale: number };

function build(library: Map<Key, THREE.Object3D>) {
  const add = (key: Key, at: { x: number; z: number }, opts: { rotY?: number; scale?: number } = {}) => {
    const obj = library.get(key)!.clone(true);
    obj.position.set(at.x, 0, at.z);
    obj.rotation.y = opts.rotY ?? 0;
    obj.scale.setScalar(opts.scale ?? 1);
    return obj;
  };
  const pick = <T,>(list: readonly T[], q: number, r: number, salt = 0) =>
    list[Math.floor(hash(q, r, salt) * list.length) % list.length]!;

  const board = new THREE.Group();
  const tiles: Piece[] = [];
  const dressing: Piece[] = [];

  for (let q = -SEA_RADIUS; q <= SEA_RADIUS; q++) {
    for (let r = -SEA_RADIUS; r <= SEA_RADIUS; r++) {
      const h = { q, r };
      const ring = ringOf(h);
      if (ring > SEA_RADIUS) continue;
      const c = center(h);
      const land = ring <= LAND_RADIUS;
      const tile = add(land ? 'grass' : 'water', c);
      board.add(tile);
      tiles.push({ obj: tile, delay: ring, scale: 1 });
      if (!land) continue;

      const spin = Math.floor(hash(q, r, 9) * 6) * (Math.PI / 3);
      const jitter = (salt: number) => ({
        x: c.x + (hash(q, r, salt) - 0.5) * 0.9,
        z: c.z + (hash(q, r, salt + 1) - 0.5) * 0.9,
      });
      const dress = (obj: THREE.Object3D) => {
        board.add(obj);
        dressing.push({ obj, delay: ring + hash(q, r, 2) * 0.6, scale: obj.scale.x });
      };
      switch (TERRAIN[`${q},${r}`]) {
        case 'grain':
          dress(add('grain', c, { rotY: spin, scale: 0.78 }));
          break;
        case 'timber': {
          const key = pick(['forestA', 'forestB', 'forestC', 'forestD'] as const, q, r);
          dress(add(key, c, { rotY: spin, scale: 0.74 }));
          break;
        }
        case 'stone': {
          const key = pick(['quarryA', 'quarryB', 'quarryC'] as const, q, r);
          dress(add(key, c, { rotY: spin, scale: key === 'quarryB' ? 0.47 : 0.55 }));
          dress(add(pick(['rockA', 'rockC'] as const, q, r, 3), jitter(4), { rotY: spin, scale: 1.2 }));
          break;
        }
        case 'wool': {
          const key = pick(['pastureA', 'pastureB', 'pastureC'] as const, q, r);
          dress(add(key, c, { rotY: spin, scale: key === 'pastureB' ? 0.85 : 0.72 }));
          dress(add(pick(['treeA', 'treeB'] as const, q, r, 5), { x: c.x + 0.42, z: c.z - 0.3 }, { scale: 0.55 }));
          break;
        }
        default:
          break;
      }
    }
  }

  // Two settlements already standing, out on the board.
  const footprint = (key: Key) => new THREE.Box3().setFromObject(library.get(key)!).getSize(new THREE.Vector3()).x || 1;
  const settle = (key: Key, h: Axial, c: number) => {
    const obj = add(key, corner(h, c), { rotY: (20 * Math.PI) / 180, scale: 0.62 / footprint(key) });
    board.add(obj);
    dressing.push({ obj, delay: ringOf(h) + 0.4, scale: obj.scale.x });
  };
  settle('villageBlue', { q: 1, r: -1 }, 4);
  settle('townGreen', { q: -1, r: 1 }, 1);

  // The village that lights up, on a corner of the centre hex, with Tavren's gold ring.
  const at = corner({ q: 0, r: 0 }, 1);
  const villageScale = 0.62 / footprint('villageRed');
  const village = add('villageRed', at, { rotY: (20 * Math.PI) / 180, scale: villageScale });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.46, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#ffd34d', toneMapped: false, transparent: true, depthWrite: false })
  );
  ring.position.set(at.x, 0.02, at.z);
  board.add(village, ring);

  return { board, tiles, dressing, village, villageScale, ring };
}

/* ---------- Mount ---------- */

export async function mountTavren(stage: HTMLElement): Promise<void> {
  const library = await loadLibrary();
  const { board, tiles, dressing, village, villageScale, ring } = build(library);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(board);
  scene.add(new THREE.HemisphereLight('#fff6e0', '#4c6b5a', 1.6));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(TAVREN.fov, 1, 0.1, 100);
  const target = new THREE.Vector3(0, -0.3, 0);
  /** Island radius plus a margin, which the camera keeps in frame. */
  const reach = (SEA_RADIUS + 0.8) * HEX_SIZE * Math.sqrt(3);

  let p = 0;
  let width = 0;
  let height = 0;

  const apply = () => {
    // Tilt: straight down to the three-quarter view, turning slightly as it goes.
    const t = easeInOut(span(p, TAVREN.tilt[0], TAVREN.tilt[1]));
    const polar = THREE.MathUtils.degToRad(0.01 + (TAVREN.tiltTo - 0.01) * t);
    const azimuth = THREE.MathUtils.degToRad(TAVREN.turnFrom + (TAVREN.turnTo - TAVREN.turnFrom) * t);
    const aspect = width / Math.max(1, height);
    const fit = reach / Math.tan(THREE.MathUtils.degToRad(TAVREN.fov / 2)) / Math.min(1, aspect);
    const distance = fit * (1 - 0.12 * t);
    camera.position.set(
      target.x + distance * Math.sin(polar) * Math.sin(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + distance * Math.sin(polar) * Math.cos(azimuth)
    );
    camera.up.set(Math.sin(azimuth + Math.PI), 0, Math.cos(azimuth + Math.PI)).lerp(new THREE.Vector3(0, 1, 0), t);
    camera.lookAt(target);

    // Rise: each tile extrudes from flat, a ripple outward from the centre.
    const [r0, r1] = TAVREN.rise;
    for (const tile of tiles) {
      const start = r0 + tile.delay * TAVREN.ripple;
      const k = span(p, start, Math.min(r1, start + TAVREN.tileTime));
      const lift = easeOutBack(k, 1.2);
      tile.obj.scale.y = Math.max(0.04, lift);
      tile.obj.position.y = -0.5 * (1 - easeOutCubic(k));
    }

    // Dress: terrain grows in, ripple outward.
    const [d0, d1] = TAVREN.dress;
    for (const d of dressing) {
      const start = d0 + d.delay * TAVREN.ripple;
      const k = span(p, start, Math.min(d1, start + TAVREN.tileTime));
      const s = d.scale * Math.max(0.0001, easeOutBack(k, 2));
      d.obj.scale.setScalar(s);
      d.obj.visible = k > 0;
    }

    // Light: the village drops in with a squash, then the gold ring opens under it.
    const [v0, v1] = TAVREN.village;
    const drop = span(p, v0, v0 + (v1 - v0) * 0.6);
    const land = span(p, v0 + (v1 - v0) * 0.55, v1);
    village.visible = drop > 0;
    village.position.y = 2.2 * (1 - easeOutCubic(drop) ** 2);
    const squash = Math.sin(Math.PI * land) * (1 - land);
    village.scale.set(villageScale * (1 + 0.16 * squash), villageScale * (1 - 0.24 * squash), villageScale * (1 + 0.16 * squash));
    ring.visible = land > 0;
    ring.scale.setScalar(Math.max(0.001, easeOutBack(land, 2.2)));
    (ring.material as THREE.MeshBasicMaterial).opacity = Math.min(1, land * 3);

    renderer.render(scene, camera);
  };

  const resize = () => {
    const r = stage.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    apply();
  };

  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  new ResizeObserver(resize).observe(stage);
  resize();

  onMoment(stage.closest<HTMLElement>('[data-scene]')?.id ?? 'tavren', (value) => {
    p = value;
    apply();
  });

  renderer.domElement.addEventListener('webglcontextlost', () => stage.classList.remove('is-3d'));
  stage.classList.add('is-3d');
}
