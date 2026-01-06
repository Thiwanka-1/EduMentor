export function applyVisemes(avatar, visemes) {
  let index = 0;

  function step() {
    if (index >= visemes.length) return;

    const v = visemes[index];
    avatar.setMouthShape(v.phoneme);
    index++;

    setTimeout(step, v.time);
  }

  step();
}
