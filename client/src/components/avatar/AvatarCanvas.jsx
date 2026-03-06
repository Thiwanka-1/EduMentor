import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { setAvatarMesh } from "../utils/visemePlayer.jsx";

const AVATAR_URL =
  "https://models.readyplayer.me/68fd395632656761d7f30637.glb";
  

function AvatarModel() {
  const group = useRef();
  const { scene } = useGLTF(AVATAR_URL);

  useEffect(() => {
    // FACE-FOCUSED SETTINGS
    scene.scale.set(1.4, 1.4, 1.4);       // Slightly reduce size
    scene.position.set(0, -2.2, 0);       // Move DOWN to bring face up into view

    // Optional: hide lower body completely
    scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name.toLowerCase().includes("legs") ||
            child.name.toLowerCase().includes("hips") ||
            child.name.toLowerCase().includes("spine")) {
          child.visible = false;
        }
      }
    });

    // Find head skinned mesh for visemes
    let mesh = null;
    scene.traverse((child) => {
      if (child.isSkinnedMesh) mesh = child;
    });

    if (mesh) setAvatarMesh(mesh);
  }, [scene]);

  return <primitive ref={group} object={scene} />;
}

export default function AvatarCanvas() {
  return (
    <Canvas
  camera={{ position: [0, 1.55, 1.0], fov: 28 }}
  gl={{
    antialias: true,
    powerPreference: "high-performance",
    alpha: true,
  }}
  dpr={[1, 2]}
>

      <ambientLight intensity={0.9} />
      <directionalLight position={[2,3, 2]} intensity={1.3} />

      <AvatarModel />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.35}
        maxPolarAngle={Math.PI * 0.55}
        rotateSpeed={0.6}
      />

      <Environment preset="studio" />
    </Canvas>
  );
}

useGLTF.preload(AVATAR_URL);
