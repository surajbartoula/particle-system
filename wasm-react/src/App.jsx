import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

let wasmModule = null;

async function loadWasm() {
  if (wasmModule) return wasmModule;

  try {
    const wasm = await import("/src/pkg/wasm_module.js");
    await wasm.default("/src/pkg/wasm_module_bg.wasm");
    wasmModule = new wasm.WasmCalculator();
    console.log("✅ WASM Module Loaded Successfully");
    return wasmModule;
  } catch (error) {
    console.error("❌ Failed to load WASM:", error);
    throw error;
  }
}

function WasmTerrain() {
  const meshRef = useRef();
  const geometryRef = useRef();

  useEffect(() => {
    const size = 20;
    const segments = 40;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geometryRef.current = geo;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !geometryRef.current || !wasmModule) return;

    const time = clock.getElapsedTime();
    const positions = geometryRef.current.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      positions[i + 2] = wasmModule.calculate_wave(x, z, time);
    }

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometryRef.current}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, 0]}
    >
      <meshStandardMaterial color="#4a90e2" wireframe side={THREE.DoubleSide} />
    </mesh>
  );
}

function WasmParticles() {
  const pointsRef = useRef();
  const particleCount = 150;

  const positionsRef = useRef(new Float32Array(particleCount * 3));
  const colorsRef = useRef(new Float32Array(particleCount * 3));

  useFrame(({ clock }) => {
    if (!pointsRef.current || !wasmModule) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      const x = wasmModule.calculate_spiral_x(i, particleCount, time);
      const y = wasmModule.calculate_spiral_y(i, time);
      const z = wasmModule.calculate_spiral_z(i, particleCount, time);

      positionsRef.current[idx] = x;
      positionsRef.current[idx + 1] = y;
      positionsRef.current[idx + 2] = z;

      colorsRef.current[idx] = wasmModule.calculate_color_r(x);
      colorsRef.current[idx + 1] = wasmModule.calculate_color_g(y);
      colorsRef.current[idx + 2] = wasmModule.calculate_color_b(z);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colorsRef.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors sizeAttenuation />
    </points>
  );
}

function RotatingCube() {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current || !wasmModule) return;

    const time = clock.getElapsedTime();
    meshRef.current.rotation.x = time * 0.5;
    meshRef.current.rotation.y = time * 0.3;

    const pos = meshRef.current.position;
    const r = wasmModule.calculate_color_r(pos.x + time);
    const g = wasmModule.calculate_color_g(pos.y + time);
    const b = wasmModule.calculate_color_b(pos.z + time);

    meshRef.current.material.color.setRGB(r, g, b);
  });

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function Scene() {
  const [showTerrain, setShowTerrain] = useState(true);
  const [showParticles, setShowParticles] = useState(true);
  const [showCube, setShowCube] = useState(true);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          color: "white",
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.85)",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "280px",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
          🦀 Rust WASM + React Three Fiber
        </h2>
        <div
          style={{
            fontSize: "11px",
            color: "#4a90e2",
            marginBottom: "15px",
            padding: "8px",
            background: "rgba(74,144,226,0.1)",
            borderRadius: "4px",
          }}
        >
          All calculations powered by WebAssembly
        </div>

        <label
          style={{ display: "block", margin: "10px 0", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={showTerrain}
            onChange={(e) => setShowTerrain(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Wave Terrain (WASM)
        </label>

        <label
          style={{ display: "block", margin: "10px 0", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={showParticles}
            onChange={(e) => setShowParticles(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Spiral Particles (WASM)
        </label>

        <label
          style={{ display: "block", margin: "10px 0", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={showCube}
            onChange={(e) => setShowCube(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Color Cube (WASM)
        </label>
      </div>

      <Canvas
        camera={{ position: [0, 5, 12], fov: 60 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#4a90e2"
        />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
        />

        {showCube && <RotatingCube />}
        {showParticles && <WasmParticles />}
        {showTerrain && <WasmTerrain />}

        <OrbitControls enableDamping dampingFactor={0.05} />
        <gridHelper args={[20, 20, "#333", "#1a1a1a"]} position={[0, -2, 0]} />
      </Canvas>
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWasm()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a2e",
          color: "#ff6b6b",
          fontFamily: "monospace",
        }}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>❌ Error Loading WASM</h2>
          <p style={{ marginTop: "10px" }}>{error}</p>
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "rgba(255,107,107,0.1)",
              borderRadius: "8px",
              textAlign: "left",
              fontSize: "14px",
            }}
          >
            <strong>Make sure you:</strong>
            <ol style={{ marginTop: "10px", paddingLeft: "20px" }}>
              <li>
                Built WASM: <code>wasm-pack build --target web</code>
              </li>
              <li>
                Copied files to: <code>public/wasm/</code>
              </li>
              <li>Have both .js and .wasm files in public/wasm/</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a2e",
          color: "white",
          fontFamily: "monospace",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>🦀 Loading Rust WASM Module...</h2>
          <p style={{ color: "#888", marginTop: "10px" }}>
            Initializing WebAssembly
          </p>
          <div
            style={{
              width: "200px",
              height: "4px",
              background: "#333",
              borderRadius: "2px",
              margin: "20px auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "50%",
                height: "100%",
                background: "#4a90e2",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e" }}>
      <Scene />
    </div>
  );
}
