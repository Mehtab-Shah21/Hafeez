/* eslint-disable react/no-unknown-property -- React Three Fiber JSX props (position, args, …) are three.js, not DOM */
import { Sky } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Sky as SkyImpl } from 'three-stdlib';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BurjAlArab,
  BurjKhalifa,
  CHASSIS_TOP,
  ContainerBox,
  DubaiFrame,
  Ferris,
  Forklift,
  Fort,
  GantryFrame,
  Mosque,
  Mountain,
  Office,
  Palm,
  QuayDetails,
  PICKUP_BED_Y,
  Pickup,
  Ship,
  Tower,
  Truck,
  useMaterials,
  Warehouse,
} from './models';
import { concreteTexture, rng, roadTexture, sandTexture, signTexture } from './textures';

/*
 * The 3D delivery journey behind the home page. Scroll position is turned into a "stage" number
 * s (0 … 11) from the DOM anchors marked [data-stage]; everything in the scene is a pure function
 * of s, eased toward the target each frame so it glides instead of stepping:
 *
 *   0–1   Port of Dubai: STS crane lifts a container off the ship onto the truck
 *   1–6   truck drives the highway past Dubai, Sharjah, Ajman, UAQ, Ras Al Khaimah
 *   6–7   Fujairah hub: truck pulls in, doors open, forklift moves the crate to a pickup
 *   7–10  pickup drives past Abu Dhabi, Al Ain, Liwa
 *   10–11 delivery at the client site
 *
 * The sun sets across the journey (day → golden hour → dusk), fog and light colours follow,
 * and the street lamps come on at dusk. Units are metres; vehicles drive toward −Z.
 */

const ROAD_LEN = 1900;
/** z of the container row the crane works on (ship bay 4); the truck parks under it. */
const Z0 = -1.8;
const ROAD_X = 3.5; // centre of our carriageway (x −3 … 10)
const LANE = 3.6; // middle lane
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const seg = (s: number, a: number, b: number) => ease(clamp01((s - a) / (b - a)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Key = [s: number, x: number, z: number];
function along(keys: Key[], s: number) {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return { x: 0, z: 0 };
  if (s <= first[0]) return { x: first[1], z: first[2] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (a && b && s <= b[0]) {
      const t = ease((s - a[0]) / (b[0] - a[0]));
      return { x: mix(a[1], b[1], t), z: mix(a[2], b[2], t) };
    }
  }
  return { x: last[1], z: last[2] };
}

const TRUCK_KEYS: Key[] = [
  [1, 16, Z0],
  [1.3, LANE, -48],
  [2, LANE, -150],
  [3, LANE, -330],
  [4, LANE, -510],
  [5, LANE, -690],
  [6, LANE, -870],
  [6.14, LANE, -1012],
  [6.24, 12, -1044],
  [6.3, 12, -1050],
];
const PICKUP_KEYS: Key[] = [
  [7, 19, -1050],
  [7.25, LANE, -1110],
  [8, LANE, -1230],
  [9, LANE, -1410],
  [10, LANE, -1590],
  [10.35, LANE, -1664],
  [10.7, 13, -1702],
];

const SIGNS: [number, string, string, string][] = [
  [-118, 'Dubai', 'دبي', 'Welcome · Jebel Ali Port'],
  [-300, 'Sharjah', 'الشارقة', 'Welcome to Sharjah'],
  [-480, 'Ajman', 'عجمان', 'Welcome to Ajman'],
  [-660, 'Umm Al Quwain', 'أم القيوين', 'Welcome to Umm Al Quwain'],
  [-840, 'Ras Al Khaimah', 'رأس الخيمة', 'Welcome to Ras Al Khaimah'],
  [-990, 'Fujairah', 'الفجيرة', 'Logistics hub · exit 1 km'],
  [-1200, 'Abu Dhabi', 'أبوظبي', 'Welcome to Abu Dhabi'],
  [-1380, 'Al Ain', 'العين', 'Garden City'],
  [-1560, 'Liwa', 'ليوا', 'Liwa Oasis'],
];

/* Sky / light keyframes over the journey: [s, sun elevation°, fog colour, light colour, light intensity]. */
const SUN: [number, number, string, string, number][] = [
  [0, 48, '#D7E4EE', '#FFFFFF', 2.6],
  [4, 32, '#E3E2D8', '#FFF4E2', 2.3],
  [7, 14, '#EFC59A', '#FFD3A0', 1.8],
  [9, 5, '#E99E73', '#FFB27A', 1.3],
  [11, -1.5, '#5E4560', '#FF9A5C', 0.55],
];

function readStage() {
  const anchors = document.querySelectorAll<HTMLElement>('[data-stage]');
  const vh = window.innerHeight;
  let s = 0;
  anchors.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const line = i === 0 ? 0 : vh * 0.55;
    s += clamp01((line - r.top) / Math.max(1, r.height));
  });
  return s;
}

/* ───────────────────────── static world ───────────────────────── */

function Ground() {
  const gl = useThree((st) => st.gl);
  const sand = useMemo(() => sandTexture(260), []);
  const road = useMemo(() => roadTexture(ROAD_LEN), []);
  const quay = useMemo(() => concreteTexture(10), []);
  useEffect(() => {
    const a = gl.capabilities.getMaxAnisotropy();
    road.anisotropy = a;
    sand.anisotropy = a;
  }, [gl, road, sand]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -900]} receiveShadow>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial map={sand} roughness={1} />
      </mesh>
      {/* our carriageway + the opposite one */}
      {[ROAD_X, -14.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -ROAD_LEN / 2 + 30]} receiveShadow>
          <planeGeometry args={[13, ROAD_LEN]} />
          <meshStandardMaterial map={road} roughness={0.88} metalness={0.05} />
        </mesh>
      ))}
      {/* guardrails */}
      {[-3.6, 10.6, -7.6, -21.6].map((x) => (
        <mesh key={x} position={[x, 0.55, -ROAD_LEN / 2 - 10]} castShadow>
          <boxGeometry args={[0.12, 0.32, ROAD_LEN - 40]} />
          <meshStandardMaterial color="#B7BCC4" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}
      {/* port: quay deck and the sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.03, 15]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial map={quay} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[330, 0.02, 120]}>
        <planeGeometry args={[600, 460]} />
        <meshStandardMaterial color="#1C4A66" roughness={0.18} metalness={0.35} />
      </mesh>
    </group>
  );
}

function Lamps({ lampMat }: { lampMat: THREE.MeshStandardMaterial }) {
  const meshes = useMemo(() => {
    const zs: number[] = [];
    for (let z = -30; z > -ROAD_LEN + 60; z -= 48) zs.push(z);
    const sides: [number, number][] = [
      [11.3, -1],
      [-4.3, 1],
    ];
    const n = zs.length * sides.length;
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 10, 8);
    const armGeo = new THREE.BoxGeometry(2.6, 0.1, 0.1);
    const headGeo = new THREE.BoxGeometry(0.7, 0.14, 0.32);
    const metal = new THREE.MeshStandardMaterial({ color: '#7D838C', metalness: 0.8, roughness: 0.35 });
    const poles = new THREE.InstancedMesh(poleGeo, metal, n);
    const arms = new THREE.InstancedMesh(armGeo, metal, n);
    const heads = new THREE.InstancedMesh(headGeo, lampMat, n);
    const m = new THREE.Matrix4();
    let i = 0;
    for (const z of zs)
      for (const [x, dir] of sides) {
        poles.setMatrixAt(i, m.makeTranslation(x, 5, z));
        arms.setMatrixAt(i, m.makeTranslation(x + dir * 1.3, 9.95, z));
        heads.setMatrixAt(i, m.makeTranslation(x + dir * 2.5, 9.85, z));
        i++;
      }
    return [poles, arms, heads];
  }, [lampMat]);
  return (
    <group>
      {meshes.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </group>
  );
}

/* Value noise for the dune field (deterministic, no dependency). */
function makeNoise(seed: number) {
  const r = rng(seed);
  const perm = Array.from({ length: 512 }, () => r());
  const h = (x: number, y: number) => perm[((x * 57 + y * 131) & 511 + 512) % 512] ?? 0;
  const n2 = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = ease(x - xi);
    const yf = ease(y - yi);
    return mix(mix(h(xi, yi), h(xi + 1, yi), xf), mix(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf);
  };
  return (x: number, y: number) => n2(x, y) * 0.55 + n2(x * 2.1, y * 2.1) * 0.28 + n2(x * 4.3, y * 4.3) * 0.17;
}

/**
 * Desert terrain: one displaced plane. Wind-shaped dunes (stretched noise, sharpened crests)
 * rise away from the highway corridor, stay flat at the port, and grow tall around Liwa.
 */
function Terrain() {
  const sand = useMemo(() => sandTexture(220), []);
  const geo = useMemo(() => {
    const noise = makeNoise(29);
    const g = new THREE.PlaneGeometry(3200, 2800, 260, 240);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -900);
    const pos = g.attributes.position;
    if (pos)
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const corridor = Math.min(Math.abs(x - ROAD_X), Math.abs(x + 14.5));
        let amp = THREE.MathUtils.smoothstep(corridor, 26, 140) * 26;
        if (z > -90 && x > -80) amp *= THREE.MathUtils.smoothstep(-z, 30, 90); // port, quay and sea
        if (z < -1480) amp *= 1 + THREE.MathUtils.smoothstep(-z, 1480, 1640) * 1.6; // Liwa
        if (x > 1000) amp = 0;
        const n = noise(x / 140, z / 60);
        const crest = Math.pow(n, 1.7);
        pos.setY(i, crest * amp - 0.08);
      }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={sand} color="#F1D2A6" roughness={1} />
    </mesh>
  );
}

function Signs() {
  const items = useMemo(() => SIGNS.map(([z, en, ar, sub]) => ({ z, map: signTexture(en, ar, sub) })), []);
  return (
    <group>
      {items.map(({ z, map }) => (
        <group key={z} position={[0, 0, z]}>
          {[-3.2, 10.2].map((x) => (
            <mesh key={x} position={[x, 4.2, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.25, 8.4, 10]} />
              <meshStandardMaterial color="#9AA1AB" metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[3.5, 7.9, 0.05]}>
            <boxGeometry args={[13.6, 0.3, 0.3]} />
            <meshStandardMaterial color="#9AA1AB" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[4.2, 7.5, 0.25]}>
            <planeGeometry args={[7.2, 2.8]} />
            <meshStandardMaterial map={map} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Landmarks() {
  return (
    <group>
      {/* Dubai */}
      <BurjKhalifa x={-170} z={-300} s={0.85} />
      {[
        [-215, -260, 18, 120, 1],
        [-130, -340, 16, 95, 2],
        [-240, -330, 20, 80, 3],
        [-120, -250, 14, 70, 4],
        [-195, -390, 22, 105, 5],
      ].map(([x, z, w, h, seed]) => (
        <Tower key={seed} x={x ?? 0} z={z ?? 0} w={w ?? 10} d={w ?? 10} h={h ?? 50} seed={seed ?? 1} />
      ))}
      <BurjAlArab x={150} z={-250} s={0.8} />
      <DubaiFrame x={95} z={-330} />
      {[-80, -60, -40].map((z, i) => (
        <Palm key={z} x={14 + i * 3} z={z} s={1.1} />
      ))}
      {/* Sharjah */}
      <Mosque x={-95} z={-440} s={0.9} />
      <Ferris x={85} z={-460} />
      {/* Ajman */}
      <Fort x={-60} z={-610} />
      <Tower x={70} z={-640} w={14} d={14} h={70} seed={9} />
      <Tower x={92} z={-620} w={12} d={12} h={55} seed={10} />
      {/* Umm Al Quwain */}
      <Fort x={55} z={-790} s={0.8} />
      {/* Ras Al Khaimah: Hajar mountains, Jebel Jais */}
      <Mountain x={-260} z={-960} r={140} h={210} seed={3} />
      <Mountain x={-150} z={-880} r={80} h={110} seed={4} />
      <Fort x={-70} z={-905} s={0.7} />
      {/* Fujairah */}
      <Mountain x={240} z={-1110} r={150} h={190} seed={5} />
      <Mountain x={140} z={-1180} r={70} h={90} seed={6} />
      <Warehouse x={36} z={-1066} />
      {/* hub yard pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[17, 0.03, -1050]} receiveShadow>
        <planeGeometry args={[16, 50]} />
        <meshStandardMaterial color="#9A9DA3" roughness={0.95} />
      </mesh>
      {/* Abu Dhabi */}
      <Mosque x={-120} z={-1300} s={1.25} />
      {[
        [95, -1290, 74],
        [112, -1300, 68],
        [128, -1312, 62],
        [143, -1326, 56],
        [156, -1342, 50],
      ].map(([x, z, h], i) => (
        <Tower key={i} x={x ?? 0} z={z ?? 0} w={9} d={9} h={h ?? 50} seed={20 + i} tint="#6A7F96" />
      ))}
      {/* Al Ain: Jebel Hafeet + oasis */}
      <Mountain x={-230} z={-1480} r={170} h={180} seed={8} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Palm key={i} x={18 + (i % 3) * 5} z={-1430 - i * 9} s={1.2} />
      ))}
      {/* Destination */}
      <Office x={30} z={-1712} />
    </group>
  );
}

/* Oncoming traffic on the far carriageway, recycled around the camera. */
function Traffic() {
  const cars = useRef<THREE.Group[]>([]);
  const colors = ['#E5E7EB', '#1F2937', '#9CA3AF', '#B91C1C', '#1E3A8A', '#F3F4F6'];
  useFrame(({ camera }, dt) => {
    cars.current.forEach((c, i) => {
      c.position.z += dt * (26 + i * 1.5);
      if (c.position.z > camera.position.z + 30) c.position.z = camera.position.z - 260 - i * 37;
    });
  });
  return (
    <group>
      {colors.map((col, i) => (
        <group
          key={col}
          ref={(el) => {
            if (el) cars.current[i] = el;
          }}
          position={[-14.5 + (i % 3) * 3.6 - 3.6, 0, -120 - i * 45]}
        >
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[1.85, 0.7, 4.5]} />
            <meshPhysicalMaterial color={col} metalness={0.6} roughness={0.3} clearcoat={1} />
          </mesh>
          <mesh position={[0, 1.2, 0.2]}>
            <boxGeometry args={[1.6, 0.5, 2.3]} />
            <meshPhysicalMaterial color="#0E141C" metalness={0.9} roughness={0.1} />
          </mesh>
          {[-0.6, 0.6].map((x) => (
            <mesh key={x} position={[x, 0.7, -2.26]}>
              <boxGeometry args={[0.35, 0.12, 0.04]} />
              <meshStandardMaterial color="#FFF6D8" emissive="#FFE7A6" emissiveIntensity={1.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── story ───────────────────────── */

function Story({ lowTier }: { lowTier: boolean }) {
  const m = useMaterials();
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E8E8E0', emissive: '#FFD58A', emissiveIntensity: 0 }), []);
  const { scene, camera } = useThree();

  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const skyRef = useRef<SkyImpl>(null);

  const truck = useRef<THREE.Group>(null);
  const truckSpin = useRef<THREE.Object3D[]>([]);
  const cargo = useRef<THREE.Group>(null);
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const truckCrate = useRef<THREE.Mesh>(null);

  const pickup = useRef<THREE.Group>(null);
  const pickupSpin = useRef<THREE.Object3D[]>([]);
  const pickupCrate = useRef<THREE.Mesh>(null);

  const fork = useRef<THREE.Group>(null);
  const carriage = useRef<THREE.Group>(null);
  const forkCrate = useRef<THREE.Mesh>(null);

  const trolley = useRef<THREE.Group>(null);
  const spreader = useRef<THREE.Group>(null);
  const ropes = useRef<THREE.Group>(null);
  const craneBox = useRef<THREE.Group>(null);

  const st = useRef({ s: -1, cam: new THREE.Vector3(-30, 15, 50), look: new THREE.Vector3(24, 11, -4), tPrev: new THREE.Vector3(16, 0, -1.8), pPrev: new THREE.Vector3(19, 0, -1050), tYaw: 0, pYaw: 0 });
  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), fog: new THREE.Color(), col: new THREE.Color(), col2: new THREE.Color(), sunDir: new THREE.Vector3() }),
    [],
  );

  const gl = useThree((x) => x.gl);
  useEffect(() => {
    scene.fog = new THREE.Fog('#D7E4EE', 140, 1100);
    // Image-based light generated locally (no HDR download) so paint, glass and chrome reflect.
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.fog = null;
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const S = st.current;
    const portrait = state.size.width < state.size.height;
    const target = readStage();
    S.s = S.s < 0 ? target : S.s + (target - S.s) * (1 - Math.exp(-dt * 5));
    const s = S.s;

    /* sky, sun, fog, lamps */
    let k = 0;
    while (k < SUN.length - 2 && s > (SUN[k + 1]?.[0] ?? Infinity)) k++;
    const A = SUN[k];
    const B = SUN[k + 1];
    if (A && B) {
      const t = clamp01((s - A[0]) / (B[0] - A[0]));
      const elev = THREE.MathUtils.degToRad(mix(A[1], B[1], t));
      const az = -0.42;
      tmp.sunDir.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), -Math.cos(az) * Math.cos(elev));
      tmp.fog.set(A[2]).lerp(tmp.col2.set(B[2]), t);
      tmp.col.set(A[3]).lerp(tmp.col2.set(B[3]), t);
      if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(tmp.fog);
      if (sun.current) {
        sun.current.color.copy(tmp.col);
        sun.current.intensity = mix(A[4], B[4], t);
      }
      if (hemi.current) hemi.current.intensity = mix(0.75, 0.3, clamp01(s / 11));
      const mat = skyRef.current?.material as THREE.ShaderMaterial | undefined;
      const sunU = mat?.uniforms?.sunPosition;
      if (sunU) (sunU.value as THREE.Vector3).copy(tmp.sunDir);
      const rayleigh = mat?.uniforms?.rayleigh;
      if (rayleigh) rayleigh.value = mix(1.2, 3.2, seg(s, 5, 10.5));
    }
    lampMat.emissiveIntensity = seg(s, 8.2, 10.6) * 4;
    m.head.emissiveIntensity = 0.6 + seg(s, 7, 10) * 2.4;

    /* port: crane moves the container from the ship to the truck */
    const f = clamp01(s);
    const GRIP = 6.3 + 2 * 2.59 + 1.495; // spreader height when it sits on the top-tier box
    const tx = f < 0.42 ? mix(16, 39, seg(f, 0, 0.15)) : mix(39, 16, seg(f, 0.42, 0.58));
    let sy = 20;
    if (f < 0.28) sy = mix(20, GRIP, seg(f, 0.15, 0.28));
    else if (f < 0.42) sy = mix(GRIP, 22, seg(f, 0.28, 0.42));
    else if (f < 0.58) sy = 22;
    else if (f < 0.72) sy = mix(22, CHASSIS_TOP + 2.59 + 0.2, seg(f, 0.58, 0.72));
    else sy = mix(CHASSIS_TOP + 2.59 + 0.2, 20, seg(f, 0.72, 0.84));
    trolley.current?.position.set(tx, 0, Z0);
    spreader.current?.position.set(0, sy, 0);
    if (ropes.current) {
      ropes.current.scale.set(1, 34.6 - sy, 1);
      ropes.current.position.set(0, sy, 0);
    }
    const onTruck = f >= 0.72;
    if (craneBox.current) {
      craneBox.current.visible = !onTruck;
      if (f < 0.28) craneBox.current.position.set(39, 6.3 + 2 * 2.59, Z0);
      else craneBox.current.position.set(tx, sy - 0.2 - 1.295, Z0);
    }
    if (cargo.current) cargo.current.visible = onTruck;

    /* truck */
    const tp = s < 1 ? { x: 16, z: Z0 } : along(TRUCK_KEYS, s);
    if (truck.current) {
      const g = truck.current;
      const dx = tp.x - S.tPrev.x;
      const dz = tp.z - S.tPrev.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.01) S.tYaw = Math.atan2(-dx, -dz);
      g.position.set(tp.x, 0, tp.z);
      g.rotation.y += (S.tYaw - g.rotation.y) * (1 - Math.exp(-dt * 6));
      const dir = dz < 0 || dx !== 0 ? 1 : -1;
      truckSpin.current.forEach((w) => (w.rotation.x -= (dir * dist) / 0.52));
      S.tPrev.set(tp.x, 0, tp.z);
    }

    /* hub: doors, forklift, crate hand-over */
    const h = s - 6;
    const doors = seg(h, 0.24, 0.32);
    doorL.current?.rotation.set(0, -doors * 1.9, 0);
    doorR.current?.rotation.set(0, doors * 1.9, 0);
    const forkKeys: Key[] = [
      [0.3, 20, -1030],
      [0.36, 12, -1036],
      [0.42, 12, -1046.3],
      [0.55, 12, -1036],
      [0.66, 19, -1036.5],
      [0.8, 19, -1047.4],
      [0.92, 19, -1036],
    ];
    const fp = along(forkKeys, h);
    // Carriage lift so the carried crate (0.6 m above the carriage) lines up with each deck.
    const pickLift = CHASSIS_TOP + 1.295 - 1.29 + 0.56 - 0.6;
    const dropLift = PICKUP_BED_Y + 0.55 - 0.6;
    let lift = 0.12;
    if (h < 0.42) lift = mix(0.12, pickLift, seg(h, 0.33, 0.41));
    else if (h < 0.8) lift = mix(pickLift, pickLift + 0.35, seg(h, 0.42, 0.46));
    else lift = mix(pickLift + 0.35, dropLift, seg(h, 0.8, 0.84));
    fork.current?.position.set(fp.x, 0, fp.z);
    carriage.current?.position.set(0, lift, 0);
    const carrying = h >= 0.44 && h < 0.82;
    if (truckCrate.current) truckCrate.current.visible = h < 0.44;
    if (forkCrate.current) forkCrate.current.visible = carrying;
    if (pickupCrate.current) pickupCrate.current.visible = h >= 0.82;

    /* pickup */
    const pp = along(PICKUP_KEYS, s);
    if (pickup.current) {
      const g = pickup.current;
      const dx = pp.x - S.pPrev.x;
      const dz = pp.z - S.pPrev.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.01) S.pYaw = Math.atan2(-dx, -dz);
      g.position.set(pp.x, 0, pp.z);
      g.rotation.y += (S.pYaw - g.rotation.y) * (1 - Math.exp(-dt * 6));
      pickupSpin.current.forEach((w) => (w.rotation.x -= dist / 0.4));
      S.pPrev.set(pp.x, 0, pp.z);
    }

    /* camera: port wide shot → chase → hub → chase → delivery */
    const onPickup = s > 6.9;
    const v = onPickup ? pp : tp;
    // Portrait screens are narrow: sit right behind the vehicle and a little higher.
    const chaseOff = portrait ? [1.5, 6.5, 24] : lowTier ? [8, 5.2, 19] : [7, 4.4, 17];
    tmp.a.set(v.x + (chaseOff[0] ?? 7), chaseOff[1] ?? 4.4, v.z + (chaseOff[2] ?? 17));
    tmp.b.set(v.x - 1.5, 1.8, v.z - 16);
    const wPort = 1 - seg(s, 0.82, 1.3);
    tmp.a.lerp(portrait ? tmp.c.set(-40 + f * 8, 22, 82 - f * 10) : tmp.c.set(-30 + f * 6, 15 - f * 3, 50 - f * 6), wPort);
    tmp.b.lerp(tmp.c.set(24, 11, -4), wPort);
    const wHub = seg(s, 6.1, 6.3) * (1 - seg(s, 6.95, 7.2));
    tmp.a.lerp(tmp.c.set(-6, 12, -1020), wHub);
    tmp.b.lerp(tmp.c.set(16, 1.2, -1046), wHub);
    const wDest = seg(s, 10.25, 10.6);
    tmp.a.lerp(tmp.c.set(-6, 10, -1662), wDest);
    tmp.b.lerp(tmp.c.set(16, 3, -1706), wDest);
    const damp = 1 - Math.exp(-dt * 4);
    S.cam.lerp(tmp.a, damp);
    S.look.lerp(tmp.b, damp);
    camera.position.copy(S.cam);
    camera.lookAt(S.look);

    /* keep the sun's shadow camera on the action */
    if (sun.current) {
      sun.current.position.set(v.x + tmp.sunDir.x * 160, Math.max(20, tmp.sunDir.y * 160), v.z + tmp.sunDir.z * 160);
      sun.current.target.position.set(v.x, 0, v.z);
      sun.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <Sky ref={skyRef} distance={4500} sunPosition={[0.3, 0.6, -1]} turbidity={7} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.86} />
      <hemisphereLight ref={hemi} args={['#CFE3FF', '#C49A6C', 0.75]} />
      <directionalLight
        ref={sun}
        castShadow={!lowTier}
        intensity={2.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-far={400}
        shadow-bias={-0.0004}
      />

      <Ground />
      <Lamps lampMat={lampMat} />
      <Terrain />
      <Signs />
      <Landmarks />
      {!lowTier && <Traffic />}

      {/* port */}
      <Ship />
      <QuayDetails />
      <GantryFrame m={m} />
      <group ref={trolley} position={[16, 0, Z0]}>
        <mesh position={[0, 34.6, 0]} material={m.dark} castShadow>
          <boxGeometry args={[5, 1.2, 4.6]} />
        </mesh>
        <group ref={ropes}>
          {[
            [-1, -2.2],
            [1, -2.2],
            [-1, 2.2],
            [1, 2.2],
          ].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x ?? 0, 0.5, z ?? 0]} material={m.chrome}>
              <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
            </mesh>
          ))}
        </group>
        <group ref={spreader} position={[0, 20, 0]}>
          <mesh material={m.yellow} castShadow>
            <boxGeometry args={[2.5, 0.4, 6.2]} />
          </mesh>
        </group>
      </group>
      <ContainerBox ref={craneBox} m={m} />

      <Truck ref={truck} m={m} spin={truckSpin} cargo={cargo} doorL={doorL} doorR={doorR} crate={truckCrate} />
      <Forklift ref={fork} m={m} carriage={carriage} crate={forkCrate} />
      <Pickup ref={pickup} m={m} spin={pickupSpin} crate={pickupCrate} />
    </>
  );
}

export default function World({ lowTier }: { lowTier: boolean }) {
  return (
    <Canvas
      shadows={!lowTier}
      dpr={lowTier ? 1 : [1, 1.75]}
      camera={{ fov: 42, near: 0.5, far: 5000, position: [-30, 15, 50] }}
      gl={{ antialias: !lowTier, powerPreference: 'high-performance' }}
    >
      <Story lowTier={lowTier} />
    </Canvas>
  );
}
