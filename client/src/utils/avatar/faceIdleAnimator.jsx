import * as THREE from "three"; // ✅ FIXED — now THREE exists

let model = null;
let clock = null;

export function setFaceModel(b) {
  model = b;
}

export function startFaceIdleAnimation() {
  if (!model) return;
  clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    if (model.head) {
      model.head.rotation.y = Math.sin(t * 0.5) * 0.02;
      model.head.rotation.x = Math.cos(t * 0.6) * 0.015;
    }

    if (model.neck) {
      model.neck.position.y = Math.sin(t * 0.8) * 0.004;
    }

    if (model.jaw) {
      model.jaw.rotation.x = Math.sin(t * 3.0) * 0.005;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

export function triggerBlink() {
  if (!model || !model.eyeL || !model.eyeR) return;

  model.eyeL.scale.y = 0.1;
  model.eyeR.scale.y = 0.1;

  setTimeout(() => {
    model.eyeL.scale.y = 1;
    model.eyeR.scale.y = 1;
  }, 130);
}

export function autoBlink() {
  setInterval(() => {
    triggerBlink();
  }, 2500 + Math.random() * 2000);
}
