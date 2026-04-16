import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast/useToast";
import { fetchAssistantPrompts, sendAssistantMessage, type AssistantAction } from "@/features/assistant/api";
import { useSpeechRecognition } from "@/shared/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/shared/hooks/useTextToSpeech";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { IconTint } from "@/components/ui/IconTint";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  actions?: AssistantAction[];
};

const DEFAULT_PROMPTS = [
  "What should I pay attention to today?",
  "Show recent sales orders.",
  "Summarize return requests by status.",
  "Find a device by IMEI 352099001761481.",
];

function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:-150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:150ms]" />
      <span className="ml-1">Thinking…</span>
    </div>
  );
}

export function OpsCopilot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const {
    isSupported: speechSupported,
    isListening,
    interimTranscript,
    error: speechError,
    toggleListening,
    stopListening,
    clearSpeechError,
  } = useSpeechRecognition({
    onFinalTranscript: (text) => {
      setInput((prev) => [prev.trim(), text].filter(Boolean).join(" ").trim());
    },
  });
  const {
    supported: ttsSupported,
    activeId: speakingMessageId,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech({
    rate: 1,
    pitch: 1,
    lang: "en-US",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void fetchAssistantPrompts()
      .then((prompts) => {
        if (prompts.length > 0) setSuggestedPrompts(prompts);
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  const historyPayload = useMemo(
    () =>
      messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    [messages],
  );

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, busy]);

  useEffect(() => {
    if (!open && isListening) {
      stopListening();
    }
    if (!open) {
      stopSpeaking();
    }
  }, [open, isListening, stopListening, stopSpeaking]);

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError, toast]);

  async function submitMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    if (isListening) stopListening();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await sendAssistantMessage({
        message: trimmed,
        context_route: location.pathname,
        history: historyPayload,
      });
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        grounded: res.grounded,
        actions: res.actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (autoSpeak) {
        speak(res.answer, assistantMsg.id);
      }
      if (res.suggested_prompts.length > 0) setSuggestedPrompts(res.suggested_prompts);
    } catch (error) {
      const msg = extractApiErrorMessage(error, "Assistant is temporarily unavailable");
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "I could not process that request right now. Please try again in a moment.",
          grounded: false,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="fixed bottom-4 right-4 z-[91] inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-brand-600 bg-brand-600 text-white shadow-raised transition-all duration-200 ease-out hover:scale-[1.04] hover:bg-brand-500 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 active:scale-[0.98]"
        aria-label={open ? "Close operations copilot" : "Open operations copilot"}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M7 8h10M7 12h7M7 16h4" strokeLinecap="round" />
          <rect x="3" y="4" width="18" height="16" rx="3" />
        </svg>
      </button>

      {open ? (
      <section
        aria-label="Operations Copilot"
        className={[
          "fixed bottom-[4.25rem] right-4 z-[90] flex max-h-[min(500px,calc(100vh-6rem))] w-[min(340px,calc(100vw-1rem))] flex-col overflow-hidden",
          "rounded-2xl border border-slate-300/80 bg-white/95 shadow-raised backdrop-blur",
        ].join(" ")}
      >
          <div className="flex items-start justify-between border-b border-slate-200 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Operations Copilot</p>
              <p className="mt-0.5 text-xs text-slate-600">Grounded answers from live IMEITrack data.</p>
            </div>
            <div className="flex items-center gap-1">
              {ttsSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (autoSpeak && speakingMessageId) stopSpeaking();
                    setAutoSpeak((v) => !v);
                  }}
                  className={[
                    "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                    autoSpeak
                      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
                  ].join(" ")}
                  aria-label={autoSpeak ? "Disable automatic voice output" : "Enable automatic voice output"}
                  title={autoSpeak ? "Auto voice on" : "Auto voice off"}
                >
                  Voice
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close copilot"
              >
                <IconTint tone="muted" size="xs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </IconTint>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-900">Try one of these prompts</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void submitMessage(prompt)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={[
                        "max-w-[92%] rounded-2xl px-2.5 py-2 text-xs leading-relaxed",
                        msg.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800",
                      ].join(" ")}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "assistant" && msg.actions && msg.actions.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.actions.map((action) => (
                            <button
                              key={`${msg.id}-${action.path}`}
                              type="button"
                              onClick={() => {
                                navigate(action.path);
                                setOpen(false);
                              }}
                              className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-700"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {msg.role === "assistant" ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <p className="text-[10px] text-slate-500">{msg.grounded ? "Grounded answer" : "General guidance"}</p>
                          {ttsSupported ? (
                            <button
                              type="button"
                              onClick={() => speak(msg.content, msg.id)}
                              className={[
                                "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition",
                                speakingMessageId === msg.id
                                  ? "border-brand-300 bg-brand-50 text-brand-700"
                                  : "border-slate-300 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
                              ].join(" ")}
                              aria-label={speakingMessageId === msg.id ? "Stop speaking message" : "Speak message"}
                            >
                              {speakingMessageId === msg.id ? "Stop audio" : "Speak"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                {busy ? <TypingIndicator /> : null}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-2.5 py-2">
            {suggestedPrompts.length > 0 ? (
              <div className="mb-1.5 flex gap-1.5 overflow-x-auto pb-1">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={`quick-${prompt}`}
                    type="button"
                    onClick={() => void submitMessage(prompt)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitMessage(input);
              }}
            >
              <div className="flex items-end gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about inventory, orders, returns, suppliers..."
                  className="mt-0 py-2 text-xs"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => {
                    clearSpeechError();
                    toggleListening();
                  }}
                  disabled={!speechSupported || busy}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  className={[
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30",
                    !speechSupported || busy
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : isListening
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3z" />
                    <path d="M5 11.5a7 7 0 0014 0M12 18.5V21M9 21h6" strokeLinecap="round" />
                  </svg>
                </button>
                <Button type="submit" disabled={busy || !input.trim()} size="sm">
                  Send
                </Button>
              </div>
              <div className="mt-1.5 min-h-[1rem] text-[10px]">
                {isListening ? (
                  <p className="inline-flex items-center gap-1 text-red-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    Listening…
                    {interimTranscript ? <span className="text-slate-500">“{interimTranscript}”</span> : null}
                  </p>
                ) : !speechSupported ? (
                  <p className="text-slate-400">Voice input is not supported in this browser.</p>
                ) : null}
              </div>
            </form>
          </div>
      </section>
      ) : null}
    </>,
    document.body,
  );
}
