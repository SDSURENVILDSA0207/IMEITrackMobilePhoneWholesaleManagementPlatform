import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type UseSpeechRecognitionOptions = {
  language?: string;
  onFinalTranscript?: (text: string) => void;
};

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { language = "en-US", onFinalTranscript } = options;
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const SpeechRecognitionCtor = useMemo(() => {
    if (typeof window === "undefined") return null;
    const w = window as typeof window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      SpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);

  useEffect(() => {
    setIsSupported(Boolean(SpeechRecognitionCtor));
  }, [SpeechRecognitionCtor]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    setError(null);
    setInterimTranscript("");

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const value = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalText += value;
        else interimText += value;
      }
      setInterimTranscript(interimText.trim());
      if (finalText.trim()) onFinalTranscript?.(finalText.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was denied. Please allow microphone permission.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try speaking a bit closer to your microphone.");
      } else {
        setError("Voice recognition failed. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionCtor, language, onFinalTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearSpeechError: () => setError(null),
  };
}
