import { useEffect, useRef, useState } from "react";

export default function useSTT({
  language = "en-US",
  onFinalText,
  onInterimText,
  onStatusChange,
} = {}) {
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const manuallyStoppedRef = useRef(false);

  const callbacksRef = useRef({
    onFinalText,
    onInterimText,
    onStatusChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onFinalText,
      onInterimText,
      onStatusChange,
    };
  }, [onFinalText, onInterimText, onStatusChange]);

  function getSpeechRecognition() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function cleanupRecognition() {
    clearSilenceTimer();

    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.stop();
    } catch {
      // ignore
    }

    recognitionRef.current = null;
  }

  function createRecognition() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      callbacksRef.current.onStatusChange?.("unsupported");
      return null;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      manuallyStoppedRef.current = false;
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      clearSilenceTimer();

      callbacksRef.current.onInterimText?.("");
      callbacksRef.current.onStatusChange?.("listening");
    };

    recognition.onresult = (event) => {
      let finalText = finalTranscriptRef.current;
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i]?.[0]?.transcript || "";

        if (event.results[i].isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += transcript;
        }
      }

      finalTranscriptRef.current = finalText.trim();
      interimTranscriptRef.current = interimText.trim();

      const liveText =
        `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim();

      callbacksRef.current.onInterimText?.(liveText);

      clearSilenceTimer();

      silenceTimerRef.current = setTimeout(() => {
        try {
          manuallyStoppedRef.current = true;
          recognition.stop();
        } catch (err) {
          console.error("auto-stop speech recognition error:", err);
        }
      }, 1800);
    };

    recognition.onerror = (event) => {
      clearSilenceTimer();
      setIsListening(false);

      if (event.error === "no-speech") {
        callbacksRef.current.onStatusChange?.("no-speech");
        callbacksRef.current.onInterimText?.("");
        return;
      }

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "permission-denied"
      ) {
        callbacksRef.current.onStatusChange?.("permission-denied");
        callbacksRef.current.onInterimText?.("");
        return;
      }

      if (event.error === "language-not-supported") {
        callbacksRef.current.onStatusChange?.("language-not-supported");
        callbacksRef.current.onInterimText?.("");
        return;
      }

      console.error("Speech recognition error:", event.error);
      callbacksRef.current.onStatusChange?.(event.error || "error");
      callbacksRef.current.onInterimText?.("");
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);

      const combinedText =
        `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim();

      if (combinedText) {
        callbacksRef.current.onFinalText?.(combinedText);
        callbacksRef.current.onStatusChange?.("final");
      } else if (manuallyStoppedRef.current) {
        callbacksRef.current.onStatusChange?.("stopped");
      } else {
        callbacksRef.current.onStatusChange?.("ended");
      }

      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      callbacksRef.current.onInterimText?.("");
      manuallyStoppedRef.current = false;
    };

    recognitionRef.current = recognition;
    return recognition;
  }

  function startListening() {
    let recognition = recognitionRef.current;

    if (!recognition) {
      recognition = createRecognition();
    }

    if (!recognition) return false;

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    manuallyStoppedRef.current = false;
    clearSilenceTimer();

    try {
      recognition.lang = language || "en-US";
      recognition.start();
      return true;
    } catch (err) {
      console.error("startListening error:", err);
      return false;
    }
  }

  function stopListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    manuallyStoppedRef.current = true;
    clearSilenceTimer();

    try {
      recognition.stop();
    } catch (err) {
      console.error("stopListening error:", err);
    }
  }

  useEffect(() => {
    cleanupRecognition();
    createRecognition();

    return () => {
      cleanupRecognition();
    };
  }, [language]);

  return {
    isListening,
    startListening,
    stopListening,
  };
}