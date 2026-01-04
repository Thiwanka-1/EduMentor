import { useState, useRef } from "react";

export default function useVoiceSTT(onResult) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize browser STT
  function initRecognizer() {
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // Important: prevents looping

    return recognition;
  }

  function startListening() {
    if (isListening) return;

    const recognition = initRecognizer();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setIsListening(true);

    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("🎤 Voice Input:", text);

      if (onResult) onResult(text);
      stopListening();
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  }

  function stopListening() {
    const rec = recognitionRef.current;
    if (rec) rec.stop();

    recognitionRef.current = null;
    setIsListening(false);
  }

  return { isListening, startListening, stopListening };
}
