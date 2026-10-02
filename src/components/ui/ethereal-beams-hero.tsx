import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

function Beam({ position, rotation, color, scale = 1 }: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[1 * scale, 9 * scale]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.07}
        blending={THREE.NormalBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Particles() {
  const { positions } = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return { positions };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#aaaaaa"
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </points>
  );
}

function Scene() {
  const beams = useMemo(() => {
    const arr: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      color: string;
      scale: number;
    }> = [];
    // Monochrome palette only
    const colors = ["#ffffff", "#aaaaaa", "#666666", "#ffffff"];
    const beamNumber = 3;
    for (let i = 0; i < beamNumber; i++) {
      arr.push({
        position: [(i - beamNumber / 2) * 3 + Math.random() * 0.5, 0, -i * 0.3],
        rotation: [0, 0, (Math.random() - 0.5) * 0.3 + 0.05],
        color: colors[i % colors.length],
        scale: 0.9 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 6, 18]} />
      {beams.map((b, i) => (
        <Beam key={i} {...b} />
      ))}
      <Particles />
    </>
  );
}

export function EtherealBeamsHero({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          dpr={[1, 1]}
          frameloop="demand"
          gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        >
          <Scene />
        </Canvas>
      </div>
      {/* Soft fog overlays for premium monochrome feel */}
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.85)_85%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default EtherealBeamsHero;
