export function playVisemes(visemes, { onViseme, onSilence }) {
  const timeouts = [];

  for (const { t, v } of visemes) {
    const id = setTimeout(() => {
      if (v === "SIL") onSilence?.();
      else onViseme?.(v);
    }, t * 1000);
    timeouts.push(id);
  }

  const last = visemes?.[visemes.length - 1];
  if (last) {
    const id = setTimeout(() => onSilence?.(), last.t * 1000 + 120);
    timeouts.push(id);
  }

  return () => timeouts.forEach(clearTimeout);
}
