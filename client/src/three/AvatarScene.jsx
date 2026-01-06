/* eslint-disable react-hooks/immutability */
import React, {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const VISEMES = ["AA", "EE", "OH", "OO", "FV", "MBP", "SS", "SIL"];

const MORPH_CANDIDATES = {
  AA: ["viseme_aa", "mouth_aa", "A", "aa", "jawOpen", "mouthOpen", "JawOpen"],
  EE: ["viseme_ee", "mouth_ee", "I", "ee", "E", "viseme_I", "viseme_ih"],
  OH: ["viseme_oh", "mouth_oh", "O", "oh", "viseme_O"],
  OO: ["viseme_ou", "mouth_ou", "U", "oo", "ou", "viseme_U", "viseme_uw"],
  FV: ["viseme_fv", "FV", "fv", "F", "V"],
  MBP: ["viseme_mbp", "MBP", "mbp", "M", "B", "P"],
  SS: ["viseme_ss", "SS", "ss", "S", "Z"],
  SIL: ["sil", "SIL", "rest", "neutral", "idle", "mouthClose", "mouth_close"],
};

function Rig({ url, apiRef }) {
  const { scene } = useGLTF(url);

  const stateRef = useRef({ v: "SIL", target: 0 });
  const smoothRef = useRef(0);

  const morphMeshesRef = useRef([]);
  const morphIndexRef = useRef({});
  const jawBoneRef = useRef(null);

  useEffect(() => {
    const morphMeshes = [];
    let jaw = null;

    scene.traverse((o) => {
      if (o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) {
        morphMeshes.push(o);
      }
      if (o.isBone) {
        const n = (o.name || "").toLowerCase();
        if (n.includes("jaw") || n.includes("mandible")) jaw = o;
      }
    });

    const map = {};
    for (const v of VISEMES) map[v] = [];

    for (const mesh of morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const dictKeys = Object.keys(dict || {});

      for (const v of VISEMES) {
        const candidates = MORPH_CANDIDATES[v] || [];
        for (const name of candidates) {
          const exact = dict[name];
          if (exact !== undefined) {
            map[v].push({ mesh, index: exact });
            break;
          }

          const foundKey = dictKeys.find(
            (k) => k.toLowerCase() === name.toLowerCase()
          );
          if (foundKey && dict[foundKey] !== undefined) {
            map[v].push({ mesh, index: dict[foundKey] });
            break;
          }
        }
      }
    }

    morphMeshesRef.current = morphMeshes;
    morphIndexRef.current = map;
    jawBoneRef.current = jaw;

    console.log("✅ GLB loaded:", url);
    console.log("Morph meshes:", morphMeshes.length);
    console.log("Jaw bone found:", jaw ? jaw.name : "NONE");
  }, [scene, url]);

  useImperativeHandle(
    apiRef,
    () => ({
      setViseme(v) {
        const ok = VISEMES.includes(v) ? v : "SIL";
        stateRef.current.v = ok;
        stateRef.current.target = ok === "SIL" ? 0 : 1;
      },
    }),
    []
  );

  useFrame((_, dt) => {
    const morphMeshes = morphMeshesRef.current;
    const morphIndex = morphIndexRef.current;
    const jawBone = jawBoneRef.current;

    smoothRef.current = THREE.MathUtils.damp(
      smoothRef.current,
      stateRef.current.target,
      18,
      dt
    );

    if (morphMeshes.length) {
      // decay all visemes to 0
      for (const v of VISEMES) {
        for (const { mesh, index } of morphIndex[v] || []) {
          const cur = mesh.morphTargetInfluences?.[index] || 0;
          mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(
            cur,
            0,
            14,
            dt
          );
        }
      }

      // apply active viseme
      const active = stateRef.current.v;
      for (const { mesh, index } of morphIndex[active] || []) {
        const cur = mesh.morphTargetInfluences?.[index] || 0;
        mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(
          cur,
          smoothRef.current,
          16,
          dt
        );
      }
      return;
    }

    if (jawBone) {
      jawBone.rotation.x = THREE.MathUtils.lerp(
        jawBone.rotation.x,
        smoothRef.current * 0.35,
        0.2
      );
    }
  });

  // ✅ HALF-BODY -> FACE ZOOM: lift model up so head is centered
  return <primitive object={scene} position={[0, -0.90, 0]} />;
}

const AvatarScene = forwardRef(function AvatarScene({ url = "/avatar.glb" }, ref) {
  const apiRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      setViseme(v) {
        apiRef.current?.setViseme(v);
      },
    }),
    []
  );

  return (
    <div className="w-full h-full">
      {/* ✅ FACE ZOOM: camera closer + smaller FOV */}
      <Canvas camera={{ position: [0, 0.75, 1.25], fov: 25 }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />

        <Suspense fallback={null}>
          <Rig url={url} apiRef={apiRef} />
        </Suspense>

        {/* ✅ Look at face level */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          target={[0, 0.7, 0]}
        />
      </Canvas>
    </div>
  );
});

export default AvatarScene;

useGLTF.preload("/avatar.glb");
