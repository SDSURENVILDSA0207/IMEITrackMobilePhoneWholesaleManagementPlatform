import { useCallback, useMemo, useState } from "react";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
};

export function useTextToSpeech(defaultOptions: SpeakOptions = {}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const supported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    [],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setActiveId(null);
  }, [supported]);

  const speak = useCallback(
    (text: string, id: string, options: SpeakOptions = {}) => {
      if (!supported || !text.trim()) return;

      if (activeId === id) {
        stop();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? defaultOptions.rate ?? 1;
      utterance.pitch = options.pitch ?? defaultOptions.pitch ?? 1;
      utterance.lang = options.lang ?? defaultOptions.lang ?? "en-US";

      utterance.onend = () => setActiveId((prev) => (prev === id ? null : prev));
      utterance.onerror = () => setActiveId((prev) => (prev === id ? null : prev));

      setActiveId(id);
      window.speechSynthesis.speak(utterance);
    },
    [activeId, defaultOptions.lang, defaultOptions.pitch, defaultOptions.rate, stop, supported],
  );

  return {
    supported,
    activeId,
    speak,
    stop,
  };
}
