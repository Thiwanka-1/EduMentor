// ------------------------------------------------------
// Global avatar mesh reference
// ------------------------------------------------------
let avatarMesh = null;

export function setAvatarMesh(mesh) {
  console.log("🧩 Avatar mesh registered:", mesh.name);
  avatarMesh = mesh;
}

// ------------------------------------------------------
// Apply viseme animation (safe version)
// ------------------------------------------------------
export function applyVisemes(visemes) {
  if (!avatarMesh) return;

  const dict = avatarMesh.morphTargetDictionary;
  const infl = avatarMesh.morphTargetInfluences;

  if (!dict || !infl) return;

  // Reset all morph targets
  for (let i = 0; i < infl.length; i++) infl[i] = 0;

  // Safe check for mouthOpen
  const mouthIndex = dict["mouthOpen"];
  if (mouthIndex === undefined) {
    console.warn("⚠️ No 'mouthOpen' morph target in this mesh");
    return;
  }

  // Get viseme (simple system: "speak" or "rest")
  const v = visemes?.[0]?.viseme || "rest";

  // Simple speaking animation
  if (v === "speak") {
    infl[mouthIndex] = 0.55; // mouth open
  } else {
    infl[mouthIndex] = 0.0;  // mouth closed
  }
}

// ------------------------------------------------------
// Reset mouth (used when audio stops)
// ------------------------------------------------------
export function resetMouth() {
  if (!avatarMesh) return;

  const infl = avatarMesh.morphTargetInfluences;
  if (!infl) return;

  for (let i = 0; i < infl.length; i++) infl[i] = 0;
}
