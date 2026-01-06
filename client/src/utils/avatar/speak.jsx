export function speakText(text) {
  if (!text) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;        // speed
  utter.pitch = 1;       // natural tone
  utter.volume = 1;      // loud

  // Try to select a female voice if available
  const voices = speechSynthesis.getVoices();
  const amy = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha"));
  if (amy) utter.voice = amy;

  speechSynthesis.speak(utter);
}
