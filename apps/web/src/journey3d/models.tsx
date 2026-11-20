/* eslint-disable react/no-unknown-property -- React Three Fiber JSX props (position, args, …) are three.js, not DOM */
import { RoundedBox } from '@react-three/drei';
import { forwardRef, useLayoutEffect, useMemo, useRef, type MutableRefObject, type Ref } from 'react';
import * as THREE from 'three';
import { claddingTexture, containerTexture, crateTexture, facadeTexture } from './textures';

/*
 * Vehicle, machinery and landmark models built from primitives at real-world scale (metres).
 * Vehicles face −Z. Moving parts are exposed through refs so World can animate them.
 */

type Refs<T> = MutableRefObject<T[]>;
const reg =
  <T,>(list: Refs<T>) =>
  (el: T | null) => {
    if (el && !list.current.includes(el)) list.current.push(el);
  };

export function useMaterials() {
  return useMemo(
    () => ({
      paint: new THREE.MeshPhysicalMaterial({ color: '#C3CCD7', metalness: 0.25, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 }),
      white: new THREE.MeshPhysicalMaterial({ color: '#F2F4F7', metalness: 0.2, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0E141C', metalness: 0.9, roughness: 0.06, clearcoat: 1 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#E8ECF0', metalness: 1, roughness: 0.18 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1A1C21', metalness: 0.4, roughness: 0.6 }),
      tyre: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.92 }),
      rim: new THREE.MeshStandardMaterial({ color: '#C7CCD3', metalness: 0.9, roughness: 0.25 }),
      yellow: new THREE.MeshStandardMaterial({ color: '#F2B516', metalness: 0.35, roughness: 0.45 }),
      yellowDark: new THREE.MeshStandardMaterial({ color: '#C98F0A', metalness: 0.35, roughness: 0.5 }),
      head: new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFE7A6', emissiveIntensity: 1.2 }),
      tail: new THREE.MeshStandardMaterial({ color: '#7A0E0E', emissive: '#FF2A2A', emissiveIntensity: 0.6 }),
      crate: new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.85 }),
      box: new THREE.MeshStandardMaterial({ map: containerTexture('#2456E0', true), metalness: 0.45, roughness: 0.5 }),
      boxEnd: new THREE.MeshStandardMaterial({ color: '#1E46C8', metalness: 0.45, roughness: 0.5 }),
      boxInside: new THREE.MeshStandardMaterial({ color: '#8C7A5C', roughness: 0.9, side: THREE.BackSide }),
    }),
    [],
  );
}
export type Mats = ReturnType<typeof useMaterials>;

/* ── wheels ── */
function Wheel({ x, z, r, w, m, spin, dual = false }: { x: number; z: number; r: number; w: number; m: Mats; spin: Refs<THREE.Object3D>; dual?: boolean }) {
  return (
    <group position={[x, r, z]}>
      <group ref={reg(spin)}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.tyre} castShadow>
          <cylinderGeometry args={[r, r, w * (dual ? 2.1 : 1), 28]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[Math.sign(x) * w * (dual ? 1.06 : 0.52), 0, 0]} material={m.rim}>
          <cylinderGeometry args={[r * 0.6, r * 0.6, 0.04, 20]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[Math.sign(x) * w * (dual ? 1.08 : 0.54), Math.cos((i * Math.PI) / 3) * r * 0.36, Math.sin((i * Math.PI) / 3) * r * 0.36]}
            rotation={[0, 0, Math.PI / 2]}
            material={m.dark}
          >
            <cylinderGeometry args={[0.045, 0.045, 0.05, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ── 20 ft container (2.44 × 2.59 × 6.06 m), centred at its own origin ── */
export const ContainerBox = forwardRef<THREE.Group, { m: Mats }>(function ContainerBox({ m }, ref) {
  // Box faces: +x, −x (corrugated sides), +y, −y, +z, −z (roof, floor, ends).
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow material={[m.box, m.box, m.boxEnd, m.boxEnd, m.boxEnd, m.boxEnd]}>
        <boxGeometry args={[2.44, 2.59, 6.06]} />
      </mesh>
    </group>
  );
});

/*
 * ── skeletal container chassis + 6×4 cab-over tractor ──
 * Origin = centre of the 20 ft box on the chassis, ground level; the tractor is at −Z.
 * Chassis: twin I-beams, four bolsters with twist-locks, gooseneck over the fifth wheel,
 * landing gear, tri-axle bogie, side guards, rear light bar and underride bar.
 */
export const CHASSIS_TOP = 1.42;
interface TruckProps {
  m: Mats;
  spin: Refs<THREE.Object3D>;
  cargo: Ref<THREE.Group>;
  doorL: Ref<THREE.Group>;
  doorR: Ref<THREE.Group>;
  crate: Ref<THREE.Mesh>;
}
function IBeam({ x, y, z, len, h, m }: { x: number; y: number; z: number; len: number; h: number; m: Mats }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={m.dark} castShadow>
        <boxGeometry args={[0.04, h, len]} />
      </mesh>
      {[-h / 2, h / 2].map((fy) => (
        <mesh key={fy} position={[0, fy, 0]} material={m.dark} castShadow>
          <boxGeometry args={[0.16, 0.03, len]} />
        </mesh>
      ))}
    </group>
  );
}
export const Truck = forwardRef<THREE.Group, TruckProps>(function Truck({ m, spin, cargo, doorL, doorR, crate }, ref) {
  const T = CHASSIS_TOP;
  return (
    <group ref={ref}>
      {/* ── chassis ── */}
      {[-0.52, 0.52].map((x) => (
        <IBeam key={x} x={x} y={T - 0.33} z={0.55} len={7.3} h={0.34} m={m} />
      ))}
      {/* gooseneck: raised neck over the fifth wheel, stepped down to the main rails */}
      {[-0.48, 0.48].map((x) => (
        <group key={x}>
          <IBeam x={x} y={1.42} z={-4.45} len={2.5} h={0.24} m={m} />
          <mesh position={[x, 1.24, -3.05]} rotation={[-0.5, 0, 0]} material={m.dark} castShadow>
            <boxGeometry args={[0.16, 0.3, 0.7]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.27, -5.15]} material={m.dark}>
        <boxGeometry args={[1.2, 0.04, 1.1]} />
      </mesh>
      {/* bolsters + amber twist-locks */}
      {[-3.03, -1.4, 1.4, 3.03].map((z) => (
        <group key={z} position={[0, T - 0.08, z]}>
          <mesh material={m.dark} castShadow receiveShadow>
            <boxGeometry args={[2.44, 0.16, Math.abs(z) < 2 ? 0.14 : 0.24]} />
          </mesh>
          {Math.abs(z) > 2 &&
            [-1.14, 1.14].map((x) => (
              <mesh key={x} position={[x, 0.11, 0]} material={m.yellow}>
                <cylinderGeometry args={[0.045, 0.055, 0.08, 8]} />
              </mesh>
            ))}
        </group>
      ))}
      {/* landing gear (raised, coupled) */}
      {[-0.8, 0.8].map((x) => (
        <group key={x} position={[x, 0, -2.3]}>
          <mesh position={[0, 0.88, 0]} material={m.dark} castShadow>
            <boxGeometry args={[0.16, 0.7, 0.16]} />
          </mesh>
          <mesh position={[0, 0.5, 0]} material={m.rim}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={m.dark}>
            <boxGeometry args={[0.28, 0.05, 0.32]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.95, -2.3]} material={m.dark}>
        <boxGeometry args={[1.6, 0.08, 0.08]} />
      </mesh>
      {/* air tank + spare wheel */}
      <mesh position={[-0.2, 0.95, -0.6]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}>
        <cylinderGeometry args={[0.16, 0.16, 0.8, 14]} />
      </mesh>
      <mesh position={[0.25, 0.86, -1.3]} rotation={[0, 0, Math.PI / 2]} material={m.tyre} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.28, 22]} />
      </mesh>
      {/* side underride guards */}
      {[-1.18, 1.18].map((x) => (
        <group key={x} position={[x, 0.7, -1.3]}>
          {[-0.13, 0.13].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={m.white}>
              <boxGeometry args={[0.04, 0.1, 2.4]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* tri-axle bogie with air bags */}
      {[0.85, 2.15, 3.45].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.5, z]} rotation={[0, 0, Math.PI / 2]} material={m.dark}>
            <cylinderGeometry args={[0.08, 0.08, 2.1, 10]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh position={[sd * 0.5, 0.82, z]} material={m.dark}>
                <cylinderGeometry args={[0.15, 0.15, 0.32, 12]} />
              </mesh>
              <Wheel x={sd * 0.98} z={z} r={0.5} w={0.27} m={m} spin={spin} dual />
            </group>
          ))}
        </group>
      ))}
      {/* rear: mudflaps, light bar, underride bar */}
      {[-0.98, 0.98].map((x) => (
        <mesh key={x} position={[x, 0.5, 4.15]} material={m.tyre}>
          <boxGeometry args={[0.6, 0.55, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 4.2]} material={m.dark}>
        <boxGeometry args={[2.4, 0.22, 0.1]} />
      </mesh>
      {[-1.0, -0.75, 0.75, 1.0].map((x) => (
        <mesh key={x} position={[x, 1.05, 4.26]} material={m.tail}>
          <boxGeometry args={[0.18, 0.11, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, 4.25]} material={m.dark} castShadow>
        <boxGeometry args={[2.3, 0.14, 0.12]} />
      </mesh>

      {/* ── container on the chassis (hidden until the crane sets it down) ── */}
      <group ref={cargo} position={[0, T + 1.295, 0]} visible={false}>
        <mesh material={m.boxInside}>
          <boxGeometry args={[2.3, 2.45, 5.9]} />
        </mesh>
        <mesh castShadow material={m.box} position={[-1.22, 0, 0]}>
          <boxGeometry args={[0.02, 2.59, 6.06]} />
        </mesh>
        <mesh castShadow material={m.box} position={[1.22, 0, 0]}>
          <boxGeometry args={[0.02, 2.59, 6.06]} />
        </mesh>
        <mesh castShadow material={m.boxEnd} position={[0, 1.29, 0]}>
          <boxGeometry args={[2.44, 0.02, 6.06]} />
        </mesh>
        <mesh material={m.boxEnd} position={[0, -1.29, 0]}>
          <boxGeometry args={[2.44, 0.02, 6.06]} />
        </mesh>
        <mesh material={m.boxEnd} position={[0, 0, -3.02]}>
          <boxGeometry args={[2.44, 2.59, 0.02]} />
        </mesh>
        <group ref={doorL} position={[-1.22, 0, 3.03]}>
          <mesh material={m.boxEnd} position={[0.61, 0, 0]} castShadow>
            <boxGeometry args={[1.22, 2.55, 0.05]} />
          </mesh>
        </group>
        <group ref={doorR} position={[1.22, 0, 3.03]}>
          <mesh material={m.boxEnd} position={[-0.61, 0, 0]} castShadow>
            <boxGeometry args={[1.22, 2.55, 0.05]} />
          </mesh>
        </group>
        <mesh ref={crate} material={m.crate} position={[0, -1.29 + 0.56, 2.2]} castShadow>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
        </mesh>
      </group>

      {/* ── 6×4 cab-over tractor ── */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.98, -7.2]} material={m.dark} castShadow>
          <boxGeometry args={[0.12, 0.28, 7.0]} />
        </mesh>
      ))}
      {/* fifth wheel */}
      <mesh position={[0, 1.18, -5.3]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.12, 20]} />
      </mesh>
      {/* catwalk, fuel tank, battery box */}
      <mesh position={[0, 1.2, -7.6]} material={m.rim}>
        <boxGeometry args={[1.4, 0.04, 0.9]} />
      </mesh>
      <mesh position={[-1.0, 0.85, -7.1]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 1.5, 20]} />
      </mesh>
      <mesh position={[1.0, 0.82, -7.1]} material={m.dark} castShadow>
        <boxGeometry args={[0.55, 0.6, 1.3]} />
      </mesh>
      {/* quarter fenders over the drive axles */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.98, 1.18, -5.25]} material={m.dark}>
          <boxGeometry args={[0.66, 0.04, 2.3]} />
        </mesh>
      ))}
      {/* exhaust stacks */}
      {[-1.12, 1.12].map((x) => (
        <mesh key={x} position={[x, 2.75, -8.15]} material={m.chrome} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.9, 12]} />
        </mesh>
      ))}
      <group position={[0, 0, -9.4]}>
        <RoundedBox args={[2.5, 2.7, 2.3]} radius={0.16} smoothness={4} position={[0, 2.62, 0]} material={m.paint} castShadow />
        <RoundedBox args={[2.42, 0.8, 1.9]} radius={0.22} smoothness={4} position={[0, 4.25, 0.12]} material={m.paint} castShadow />
        <mesh position={[0, 4.62, -0.6]} rotation={[0.35, 0, 0]} material={m.paint}>
          <boxGeometry args={[2.3, 0.05, 0.7]} />
        </mesh>
        {/* windscreen + sun visor + roof markers */}
        <mesh position={[0, 3.12, -1.16]} rotation={[-0.06, 0, 0]} material={m.glass}>
          <boxGeometry args={[2.22, 1.05, 0.04]} />
        </mesh>
        <mesh position={[0, 3.72, -1.2]} rotation={[0.3, 0, 0]} material={m.dark}>
          <boxGeometry args={[2.3, 0.04, 0.32]} />
        </mesh>
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <mesh key={x} position={[x, 4.67, -0.98]} material={m.head}>
            <boxGeometry args={[0.12, 0.05, 0.05]} />
          </mesh>
        ))}
        {[-1.26, 1.26].map((x) => (
          <mesh key={x} position={[x, 3.12, -0.45]} material={m.glass}>
            <boxGeometry args={[0.03, 0.85, 0.95]} />
          </mesh>
        ))}
        {/* grille slats, headlights, bumper, steps */}
        {[1.75, 1.95, 2.15, 2.35].map((y) => (
          <mesh key={y} position={[0, y, -1.17]} material={m.dark}>
            <boxGeometry args={[1.8, 0.12, 0.05]} />
          </mesh>
        ))}
        {[-0.92, 0.92].map((x) => (
          <mesh key={x} position={[x, 1.55, -1.17]} material={m.head}>
            <boxGeometry args={[0.45, 0.16, 0.05]} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, -1.1]} material={m.dark}>
          <boxGeometry args={[2.5, 0.42, 0.32]} />
        </mesh>
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 0.95, 0.2]} material={m.rim}>
            <boxGeometry args={[0.2, 0.04, 0.5]} />
          </mesh>
        ))}
        {/* mirrors on arms */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[sd * 1.45, 3.3, -0.95]} material={m.dark}>
              <boxGeometry args={[0.13, 0.55, 0.18]} />
            </mesh>
            <mesh position={[sd * 1.33, 3.62, -0.9]} material={m.dark}>
              <boxGeometry args={[0.3, 0.04, 0.04]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* steer axle + tandem drive axles */}
      {[-1.05, 1.05].map((x) => (
        <Wheel key={x} x={x} z={-9.2} r={0.52} w={0.32} m={m} spin={spin} />
      ))}
      {[-5.95, -4.6].map((z) => [-0.98, 0.98].map((x) => <Wheel key={`${z}${x}`} x={x} z={z} r={0.52} w={0.28} m={m} spin={spin} dual />))}
    </group>
  );
});

/* ── pickup: origin at centre, bed at the rear (+Z) ── */
export const PICKUP_BED_Y = 0.85;
export const Pickup = forwardRef<THREE.Group, { m: Mats; spin: Refs<THREE.Object3D>; crate: Ref<THREE.Mesh> }>(function Pickup({ m, spin, crate }, ref) {
  return (
    <group ref={ref}>
      <RoundedBox args={[1.9, 0.7, 5.3]} radius={0.12} smoothness={4} position={[0, 0.85, 0]} material={m.white} castShadow />
      <RoundedBox args={[1.8, 0.85, 2.1]} radius={0.22} smoothness={4} position={[0, 1.6, -0.55]} material={m.white} castShadow />
      <mesh position={[0, 1.66, -1.62]} rotation={[0.45, 0, 0]} material={m.glass}>
        <boxGeometry args={[1.62, 0.7, 0.04]} />
      </mesh>
      {[-0.91, 0.91].map((x) => (
        <mesh key={x} position={[x, 1.68, -0.6]} material={m.glass}>
          <boxGeometry args={[0.03, 0.5, 1.6]} />
        </mesh>
      ))}
      <mesh position={[0, PICKUP_BED_Y + 0.25, 1.45]} material={m.dark}>
        <boxGeometry args={[1.7, 0.5, 2.1]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={m.yellow}>
        <boxGeometry args={[1.92, 0.08, 5.0]} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.95, -2.66]} material={m.head}>
          <boxGeometry args={[0.36, 0.12, 0.04]} />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 1.0, 2.66]} material={m.tail}>
          <boxGeometry args={[0.2, 0.25, 0.04]} />
        </mesh>
      ))}
      <mesh ref={crate} material={m.crate} position={[0, PICKUP_BED_Y + 0.55, 1.4]} visible={false} castShadow>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <group key={x}>
          <Wheel x={x} z={-1.75} r={0.4} w={0.26} m={m} spin={spin} />
          <Wheel x={x} z={1.65} r={0.4} w={0.26} m={m} spin={spin} />
        </group>
      ))}
    </group>
  );
});

/* ── forklift: origin at centre, forks to the front (−Z) ── */
export const Forklift = forwardRef<THREE.Group, { m: Mats; carriage: Ref<THREE.Group>; crate: Ref<THREE.Mesh> }>(function Forklift({ m, carriage, crate }, ref) {
  return (
    <group ref={ref}>
      <RoundedBox args={[1.2, 0.9, 2.1]} radius={0.12} smoothness={3} position={[0, 0.75, 0.2]} material={m.yellow} castShadow />
      <mesh position={[0, 0.8, 1.2]} material={m.yellowDark} castShadow>
        <boxGeometry args={[1.18, 0.95, 0.35]} />
      </mesh>
      {[
        [-0.55, -0.5],
        [0.55, -0.5],
        [-0.55, 0.9],
        [0.55, 0.9],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x ?? 0, 1.65, z ?? 0]} material={m.dark}>
          <boxGeometry args={[0.06, 1.3, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, 2.32, 0.2]} material={m.dark}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 1.25, -1.0]} material={m.dark}>
          <boxGeometry args={[0.1, 2.5, 0.1]} />
        </mesh>
      ))}
      <group ref={carriage}>
        <mesh position={[0, 0.5, -1.08]} material={m.dark}>
          <boxGeometry args={[1.0, 0.9, 0.06]} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.03, -1.65]} material={m.dark}>
            <boxGeometry args={[0.12, 0.05, 1.1]} />
          </mesh>
        ))}
        <mesh ref={crate} material={m.crate} position={[0, 0.6, -1.6]} visible={false} castShadow>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
        </mesh>
      </group>
      {[
        [-0.5, -0.55, 0.32],
        [0.5, -0.55, 0.32],
        [-0.5, 0.95, 0.26],
        [0.5, 0.95, 0.26],
      ].map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x ?? 0, r ?? 0.3, z ?? 0]} rotation={[0, 0, Math.PI / 2]} material={m.tyre} castShadow>
          <cylinderGeometry args={[r ?? 0.3, r ?? 0.3, 0.24, 18]} />
        </mesh>
      ))}
      <mesh position={[0, 2.4, 0.6]} material={m.tail}>
        <sphereGeometry args={[0.08, 10, 10]} />
      </mesh>
    </group>
  );
});

/* ── ship-to-shore gantry crane (static frame) ── */
export function GantryFrame({ m }: { m: Mats }) {
  const legs: [number, number][] = [
    [13, -8],
    [13, 8],
    [29, -8],
    [29, 8],
  ];
  return (
    <group>
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 17, z]} material={m.yellow} castShadow>
          <boxGeometry args={[1.2, 34, 1.2]} />
        </mesh>
      ))}
      {[-8, 8].map((z) => (
        <group key={z}>
          <mesh position={[21, 14, z]} material={m.yellow} castShadow>
            <boxGeometry args={[17, 1, 1]} />
          </mesh>
          <mesh position={[21, 24, z]} rotation={[0, 0, 0.55]} material={m.yellowDark}>
            <boxGeometry args={[19, 0.5, 0.5]} />
          </mesh>
          <mesh position={[21, 0.5, z]} material={m.dark}>
            <boxGeometry args={[18, 1, 1.4]} />
          </mesh>
        </group>
      ))}
      {[-1.6, 1.6].map((z) => (
        <mesh key={z} position={[31, 35.5, z]} material={m.yellow} castShadow>
          <boxGeometry args={[66, 1.6, 0.8]} />
        </mesh>
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[0 + i * 3, 35.5, 0]} material={m.yellowDark}>
          <boxGeometry args={[0.25, 1.2, 3.2]} />
        </mesh>
      ))}
      {[-1.6, 1.6].map((z) => (
        <group key={`a${z}`}>
          <mesh position={[21, 44, z]} material={m.yellow}>
            <boxGeometry args={[0.8, 18, 0.8]} />
          </mesh>
          <mesh position={[43, 44, z]} rotation={[0, 0, -1.13]} material={m.yellowDark}>
            <boxGeometry args={[0.3, 48, 0.3]} />
          </mesh>
          <mesh position={[10, 44, z]} rotation={[0, 0, 0.9]} material={m.yellowDark}>
            <boxGeometry args={[0.3, 26, 0.3]} />
          </mesh>
        </group>
      ))}
      <mesh position={[4, 38.5, 0]} material={m.white} castShadow>
        <boxGeometry args={[9, 4.5, 5]} />
      </mesh>
    </group>
  );
}

/*
 * ── post-Panamax container ship moored along Z at x≈44, bow to −Z ──
 * Flared bow, red boot topping, hatch covers, lashing bridges, instanced container stacks,
 * aft accommodation block with bridge wings, funnel and radar mast. The box the crane lifts
 * (row 0, bay 4, tier 2 → x 39, z −1.8) is left out of the stacks.
 */
const SHIP_COLORS = ['#C2410C', '#0E7490', '#4D5B7C', '#9B2C2C', '#2F6F4E', '#B7791F', '#6B7280', '#1E3A8A'];
const SHIP_X = 44;
const DECK_Y = 4.6;
const hull = new THREE.MeshStandardMaterial({ color: '#1B2A4A', roughness: 0.6, metalness: 0.3 });
const boot = new THREE.MeshStandardMaterial({ color: '#8E2424', roughness: 0.65 });
const deckGreen = new THREE.MeshStandardMaterial({ color: '#3A5A4C', roughness: 0.85 });
const hatch = new THREE.MeshStandardMaterial({ color: '#46505E', roughness: 0.7, metalness: 0.4 });
const lash = new THREE.MeshStandardMaterial({ color: '#C9CED6', roughness: 0.5, metalness: 0.6 });
const house = new THREE.MeshStandardMaterial({ color: '#EEF1F5', roughness: 0.5 });
const bridgeGlass = new THREE.MeshStandardMaterial({ color: '#13202F', metalness: 0.85, roughness: 0.1 });
const funnelRed = new THREE.MeshStandardMaterial({ color: '#B91C1C', roughness: 0.45 });
const funnelTop = new THREE.MeshStandardMaterial({ color: '#111318', roughness: 0.8 });
function shipStacks() {
  const out = new Map<string, [number, number, number][]>();
  for (let bay = 0; bay < 9; bay++)
    for (let row = 0; row < 5; row++) {
      const h = ((bay * 7 + row * 3) % 3) + 2; // 2–4 tiers
      const tiers = row === 0 && bay === 4 ? 2 : h; // the lifted box sat on tier 2 here
      for (let tier = 0; tier < tiers; tier++) {
        const c = SHIP_COLORS[(bay * 5 + row * 3 + tier * 7) % SHIP_COLORS.length] ?? '#4D5B7C';
        const list = out.get(c) ?? [];
        list.push([39 + row * 2.5, 6.3 + tier * 2.59, -27 + bay * 6.3]);
        out.set(c, list);
      }
    }
  return out;
}
function Stack({ color, at }: { color: string; at: [number, number, number][] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: containerTexture(color), metalness: 0.4, roughness: 0.55 }), [color]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    at.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [at]);
  return (
    <instancedMesh ref={ref} args={[undefined, mat, at.length]} castShadow receiveShadow>
      <boxGeometry args={[2.44, 2.59, 6.06]} />
    </instancedMesh>
  );
}
export function Ship() {
  const stacks = useMemo(shipStacks, []);
  const bow = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-7.5, 0);
    s.quadraticCurveTo(-6.2, 8.5, 0, 13);
    s.quadraticCurveTo(6.2, 8.5, 7.5, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // shape y → −Z (forward), extrusion → +Y
    return g;
  }, []);
  return (
    <group>
      {/* hull, flared bow, boot topping */}
      <mesh position={[SHIP_X, DECK_Y - 3.3, 0]} material={hull} castShadow receiveShadow>
        <boxGeometry args={[15, 6.6, 66]} />
      </mesh>
      <mesh geometry={bow} material={hull} position={[SHIP_X, -2, -33]} scale={[1, 6.6, 1]} castShadow />
      <mesh position={[SHIP_X, -0.6, 0]} material={boot}>
        <boxGeometry args={[15.05, 2.8, 66.05]} />
      </mesh>
      <mesh geometry={bow} material={boot} position={[SHIP_X, -2, -33.02]} scale={[1.004, 2.8, 1.004]} />
      <mesh position={[SHIP_X, DECK_Y + 0.02, -1]} material={deckGreen} receiveShadow>
        <boxGeometry args={[14.4, 0.05, 68]} />
      </mesh>
      {/* bulwark along the sides, breakwater at the bow */}
      {[-7.4, 7.4].map((dx) => (
        <mesh key={dx} position={[SHIP_X + dx, DECK_Y + 0.5, -2]} material={hull}>
          <boxGeometry args={[0.15, 1, 62]} />
        </mesh>
      ))}
      <mesh position={[SHIP_X, DECK_Y + 1.6, -31.5]} rotation={[0.35, 0, 0]} material={hull} castShadow>
        <boxGeometry args={[12, 3, 0.35]} />
      </mesh>
      {/* forecastle mast */}
      <mesh position={[SHIP_X, DECK_Y + 4, -40]} material={lash}>
        <cylinderGeometry args={[0.15, 0.25, 8, 8]} />
      </mesh>
      {/* hatch covers + lashing bridges */}
      {Array.from({ length: 9 }, (_, bay) => {
        const z = -27 + bay * 6.3;
        return (
          <group key={bay}>
            <mesh position={[SHIP_X, DECK_Y + 0.2, z]} material={hatch} castShadow receiveShadow>
              <boxGeometry args={[13, 0.4, 6.1]} />
            </mesh>
            {bay % 2 === 1 && (
              <group position={[SHIP_X, DECK_Y + 1.6, z + 3.15]}>
                <mesh material={lash}>
                  <boxGeometry args={[13.2, 0.08, 0.18]} />
                </mesh>
                <mesh position={[0, 1.2, 0]} material={lash}>
                  <boxGeometry args={[13.2, 0.06, 0.06]} />
                </mesh>
                {[-6.4, -3.75, -1.25, 1.25, 3.75, 6.4].map((x) => (
                  <mesh key={x} position={[x, -0.4, 0]} material={lash}>
                    <boxGeometry args={[0.08, 3.2, 0.12]} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
      {[...stacks.entries()].map(([c, at]) => (
        <Stack key={c} color={c} at={at} />
      ))}
      {/* aft accommodation block, bridge with wings, radar mast, funnel */}
      <group position={[SHIP_X, DECK_Y, 29.5]}>
        <mesh position={[0, 7, 0]} material={house} castShadow receiveShadow>
          <boxGeometry args={[11, 14, 5.6]} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 2.5 + i * 2.6, -2.81]} material={bridgeGlass}>
            <boxGeometry args={[9.5, 0.7, 0.03]} />
          </mesh>
        ))}
        <mesh position={[0, 15, -0.4]} material={house} castShadow>
          <boxGeometry args={[18, 2.2, 3.6]} />
        </mesh>
        <mesh position={[0, 15.2, -2.21]} material={bridgeGlass}>
          <boxGeometry args={[17.6, 1.1, 0.03]} />
        </mesh>
        <mesh position={[0, 18.5, 0]} material={lash}>
          <cylinderGeometry args={[0.18, 0.35, 5, 8]} />
        </mesh>
        <mesh position={[0, 19.2, 0]} material={lash}>
          <boxGeometry args={[3.2, 0.12, 0.25]} />
        </mesh>
        <mesh position={[0, 21.1, 0]} material={funnelRed}>
          <sphereGeometry args={[0.22, 10, 10]} />
        </mesh>
        <mesh position={[0, 17.5, 1.7]} material={funnelRed} castShadow>
          <boxGeometry args={[3.6, 5, 2.4]} />
        </mesh>
        <mesh position={[0, 20.4, 1.7]} material={funnelTop}>
          <boxGeometry args={[3.7, 0.9, 2.5]} />
        </mesh>
        {/* lifeboat */}
        <mesh position={[5.8, 9, 1]} rotation={[Math.PI / 2, 0, 0]} material={funnelRed}>
          <capsuleGeometry args={[0.9, 3.5, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/* ── quay apron details: crane rails, edge line, rubber fenders, bollards ── */
export function QuayDetails() {
  return (
    <group>
      {[13, 29].map((x) => (
        <mesh key={x} position={[x, 0.07, 0]} material={lash} receiveShadow>
          <boxGeometry args={[0.3, 0.08, 70]} />
        </mesh>
      ))}
      <mesh position={[29.85, 0.06, 15]} material={hatch}>
        <boxGeometry args={[0.3, 0.06, 70]} />
      </mesh>
      <mesh position={[29.4, 0.06, 15]}>
        <boxGeometry args={[0.25, 0.05, 70]} />
        <meshStandardMaterial color="#E8B41A" roughness={0.6} />
      </mesh>
      <mesh position={[29.9, -1.5, 15]} material={hatch}>
        <boxGeometry args={[0.3, 3, 70]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => -18 + i * 9).map((z) => (
        <group key={z}>
          <mesh position={[30.3, -0.6, z]} material={funnelTop}>
            <boxGeometry args={[0.8, 2.4, 2]} />
          </mesh>
          <mesh position={[29.2, 0.4, z + 4]} material={funnelTop} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.75, 12]} />
          </mesh>
          <mesh position={[29.2, 0.82, z + 4]} material={funnelTop}>
            <cylinderGeometry args={[0.42, 0.42, 0.12, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── landmarks (stylised, real proportions, read through haze) ── */
const concrete = new THREE.MeshStandardMaterial({ color: '#E9E4DA', roughness: 0.8 });
const sandstone = new THREE.MeshStandardMaterial({ color: '#C9A47A', roughness: 0.95 });
const gold = new THREE.MeshStandardMaterial({ color: '#C9A24A', metalness: 0.8, roughness: 0.3 });

export function Tower({ x, z, w, d, h, seed, tint = '#8FA4BA' }: { x: number; z: number; w: number; d: number; h: number; seed: number; tint?: string }) {
  const mat = useMemo(() => {
    const t = facadeTexture(seed, tint);
    t.repeat.set(Math.max(1, w / 10), Math.max(1, h / 20));
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.35, roughness: 0.25 });
  }, [seed, tint, w, h]);
  return (
    <mesh position={[x, h / 2, z]} material={mat}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

export function BurjKhalifa({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const mat = useMemo(() => {
    const t = facadeTexture(41, '#7F93A8');
    t.repeat.set(2, 12);
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.7, roughness: 0.2 });
  }, []);
  const tiers: [number, number][] = [
    [16, 50],
    [13, 45],
    [10.5, 40],
    [8, 36],
    [5.6, 30],
    [3.4, 26],
  ];
  let y = 0;
  return (
    <group position={[x, 0, z]} scale={s}>
      {tiers.map(([r, h], i) => {
        const el = (
          <mesh key={i} position={[0, y + h / 2, 0]} material={mat}>
            <cylinderGeometry args={[r * 0.82, r, h, 3]} />
          </mesh>
        );
        y += h;
        return el;
      })}
      <mesh position={[0, y + 30, 0]} material={mat}>
        <coneGeometry args={[2.2, 60, 6]} />
      </mesh>
    </group>
  );
}

export function BurjAlArab({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(0, 120);
    sh.quadraticCurveTo(55, 95, 62, 0);
    sh.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(sh, { depth: 18, bevelEnabled: false });
  }, []);
  return (
    <group position={[x, 0, z]} scale={s} rotation={[0, -Math.PI / 2.4, 0]}>
      <mesh geometry={geo} material={concrete} />
      <mesh position={[-2, 75, 9]} material={concrete}>
        <boxGeometry args={[3, 150, 3]} />
      </mesh>
    </group>
  );
}

export function DubaiFrame({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-24, 24].map((dx) => (
        <mesh key={dx} position={[dx, 75, 0]} material={gold}>
          <boxGeometry args={[10, 150, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 147, 0]} material={gold}>
        <boxGeometry args={[58, 9, 8]} />
      </mesh>
    </group>
  );
}

export function Mosque({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 5, 0]} material={concrete}>
        <boxGeometry args={[70, 10, 50]} />
      </mesh>
      <mesh position={[0, 10, 0]} material={concrete}>
        <sphereGeometry args={[14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 24, 0]} material={gold}>
        <coneGeometry args={[1, 8, 8]} />
      </mesh>
      {[
        [-22, -12],
        [22, -12],
        [-22, 12],
        [22, 12],
      ].map(([dx, dz]) => (
        <mesh key={`${dx}${dz}`} position={[dx ?? 0, 10, dz ?? 0]} material={concrete}>
          <sphereGeometry args={[6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {[
        [-36, -26],
        [36, -26],
        [-36, 26],
        [36, 26],
      ].map(([dx, dz]) => (
        <group key={`m${dx}${dz}`} position={[dx ?? 0, 0, dz ?? 0]}>
          <mesh position={[0, 27, 0]} material={concrete}>
            <cylinderGeometry args={[1.6, 2, 54, 10]} />
          </mesh>
          <mesh position={[0, 57, 0]} material={gold}>
            <coneGeometry args={[1.8, 6, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Ferris({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <group position={[0, 32, 0]} name="ferris">
        <mesh material={concrete}>
          <torusGeometry args={[28, 0.8, 8, 48]} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 6]} material={concrete}>
            <boxGeometry args={[56, 0.35, 0.35]} />
          </mesh>
        ))}
      </group>
      {[-6, 6].map((dz) => (
        <mesh key={dz} position={[0, 16, dz]} rotation={[dz > 0 ? 0.18 : -0.18, 0, 0]} material={concrete}>
          <boxGeometry args={[1.2, 34, 1.2]} />
        </mesh>
      ))}
    </group>
  );
}

export function Fort({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 6, 0]} material={sandstone}>
        <boxGeometry args={[40, 12, 30]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-18 + i * 4, 12.8, 15]} material={sandstone}>
          <boxGeometry args={[2, 1.6, 1]} />
        </mesh>
      ))}
      <mesh position={[18, 10, 13]} material={sandstone}>
        <cylinderGeometry args={[5, 6, 20, 16]} />
      </mesh>
      <mesh position={[-16, 8, -12]} material={sandstone}>
        <boxGeometry args={[9, 16, 9]} />
      </mesh>
    </group>
  );
}

export function Mountain({ x, z, r, h, seed }: { x: number; z: number; r: number; h: number; seed: number }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(r, h, 14, 6);
    const pos = g.attributes.position;
    let s = seed;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
    if (pos)
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < h / 2 - 0.1) {
          pos.setX(i, pos.getX(i) * (1 + rand() * 0.35));
          pos.setZ(i, pos.getZ(i) * (1 + rand() * 0.35));
          pos.setY(i, y + rand() * h * 0.08);
        }
      }
    g.computeVertexNormals();
    return g;
  }, [r, h, seed]);
  return (
    <mesh geometry={geo} position={[x, h / 2 - 2, z]}>
      <meshStandardMaterial color="#8C6E57" roughness={1} flatShading />
    </mesh>
  );
}

export function Palm({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 4, 0]} rotation={[0, 0, 0.06]}>
        <cylinderGeometry args={[0.18, 0.28, 8, 7]} />
        <meshStandardMaterial color="#6B4A2C" roughness={1} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0.24, 8, 0]} rotation={[0.9, (i * Math.PI * 2) / 9, 0]}>
          <boxGeometry args={[0.5, 0.05, 4]} />
          <meshStandardMaterial color={i % 2 ? '#3E6B2F' : '#4E7D37'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Warehouse({ x, z }: { x: number; z: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: claddingTexture(20), roughness: 0.6, metalness: 0.3 }), []);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 6, 0]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[24, 12, 44]} />
      </mesh>
      <mesh position={[0, 12.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.2, 1.2, 24.2, 3]} />
        <meshStandardMaterial color="#9AA2AE" roughness={0.5} />
      </mesh>
      {[-12, -2, 8].map((dz) => (
        <mesh key={dz} position={[-12.05, 3, dz]}>
          <boxGeometry args={[0.1, 5, 6]} />
          <meshStandardMaterial color="#5D6878" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[-12.1, 9.5, 0]}>
        <boxGeometry args={[0.1, 2, 14]} />
        <meshStandardMaterial color="#0B1B3A" />
      </mesh>
    </group>
  );
}

export function Office({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Tower x={0} z={0} w={18} d={16} h={38} seed={77} tint="#6E8094" />
      <mesh position={[-9.5, 2.5, 0]}>
        <boxGeometry args={[1, 5, 10]} />
        <meshStandardMaterial color="#0B1B3A" />
      </mesh>
      <mesh position={[-9.6, 6.6, 0]}>
        <boxGeometry args={[0.2, 1.2, 8]} />
        <meshStandardMaterial color="#FFC62B" emissive="#FFC62B" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
