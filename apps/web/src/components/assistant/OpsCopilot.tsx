import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import "./ops-copilot.css";

import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/toast/useToast";
import { fetchAssistantPrompts, sendAssistantMessage, type AssistantAction } from "@/features/assistant/api";
import { copilotNavigationSummary } from "@/features/assistant/copilotRoutes";
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
  /** From API: navigation, mixed, data_question, … */
  intent?: string | null;
  /** Shown when the client auto-ran a navigate action for this message. */
  executedNavigation?: { pathname: string; search?: string; summary: string };
};

function normalizeSearchParamString(search: string | undefined): string {
  if (!search) return "";
  return search.startsWith("?") ? search.slice(1) : search;
}

function ExecutedNavigationConfirmation({
  executed,
  currentPathname,
  currentSearch,
  onNavigateAgain,
}: {
  executed: NonNullable<ChatMessage["executedNavigation"]>;
  currentPathname: string;
  currentSearch: string;
  onNavigateAgain: (pathname: string, search?: string) => void;
}) {
  const here =
    currentPathname === executed.pathname &&
    normalizeSearchParamString(currentSearch) === normalizeSearchParamString(executed.search);

  return (
    <div className="imei-copilot-action" role="status" aria-live="polite">
      <div className="imei-copilot-action__row">
        <div className="imei-copilot-action__signal">
          <span className="imei-copilot-action__glyph" aria-hidden>
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="imei-copilot-action__title">{executed.summary}</span>
        </div>
        {here ? (
          <span className="imei-copilot-action__here">You&apos;re here</span>
        ) : (
          <button
            type="button"
            className="imei-copilot-action__again"
            onClick={() => onNavigateAgain(executed.pathname, executed.search)}
          >
            View again
          </button>
        )}
      </div>
    </div>
  );
}

const DEFAULT_PROMPTS = [
  "What should I pay attention to today?",
  "Show recent sales orders.",
  "Summarize return requests by status.",
  "Find a device by IMEI 352099001761481.",
];

function formatMessageTimestamp(id: string): string | null {
  const match = /^[ua]-(\d+)$/.exec(id);
  if (!match) return null;
  const t = Number(match[1]);
  if (!Number.isFinite(t)) return null;
  try {
    return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="imei-copilot-typing">
        <div className="flex items-center gap-1" aria-hidden>
          <span className="imei-copilot-typing-dot" />
          <span className="imei-copilot-typing-dot" />
          <span className="imei-copilot-typing-dot" />
        </div>
        <span className="text-[11px] font-medium text-slate-500">Thinking…</span>
      </div>
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

      let executedNavigation: ChatMessage["executedNavigation"];
      if (res.action?.type === "navigate") {
        const pathname = res.action.target?.startsWith("/") ? res.action.target : `/${res.action.target ?? ""}`;
        const queryRecord = res.action.query ?? {};
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(queryRecord)) {
          if (v) sp.set(k, v);
        }
        const search = sp.toString();
        navigate({ pathname: pathname || "/", ...(search ? { search } : {}) });
        executedNavigation = {
          pathname: pathname || "/",
          ...(search ? { search } : {}),
          summary: copilotNavigationSummary(pathname, queryRecord),
        };
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        grounded: res.grounded,
        actions: res.actions,
        intent: res.intent ?? undefined,
        executedNavigation,
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

  const emptyStatePrompts = suggestedPrompts.slice(0, 4);

  return createPortal(
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="imei-copilot-fab fixed bottom-4 right-4 z-[91] inline-flex h-12 w-12 cursor-pointer items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 focus-visible:ring-offset-2"
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
          className="imei-copilot-panel fixed bottom-[4.5rem] right-4 z-[90] flex max-h-[min(520px,calc(100vh-6.5rem))] w-[min(372px,calc(100vw-1.25rem))] flex-col overflow-hidden text-slate-900"
        >
          <header className="imei-copilot-header relative shrink-0 px-4 pb-3.5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="imei-copilot-icon-well mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
                  <Sparkles className="h-[18px] w-[18px] text-brand-600" strokeWidth={1.65} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-brand-50/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700 ring-1 ring-brand-100/80">
                      AI
                    </span>
                    <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-slate-900">Operations Copilot</h2>
                  </div>
                  <p className="mt-1.5 max-w-[17rem] text-[11px] leading-relaxed text-slate-500/95">
                    Grounded answers from your live IMEITrack data—not generic support.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {ttsSupported ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (autoSpeak && speakingMessageId) stopSpeaking();
                      setAutoSpeak((v) => !v);
                    }}
                    className={[
                      "rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition duration-200",
                      autoSpeak
                        ? "bg-brand-50/95 text-brand-800 ring-1 ring-brand-200/80 shadow-sm"
                        : "text-slate-500 hover:bg-slate-100/90 hover:text-slate-700",
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
                  className="rounded-lg p-1.5 text-slate-500 transition duration-200 hover:bg-slate-100/90 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
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
          </header>

          <div className="imei-copilot-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500/90">Suggested prompts</p>
                <div className="flex flex-col gap-2">
                  {emptyStatePrompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void submitMessage(prompt)} className="imei-copilot-pill">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg) => {
                  const timeLabel = formatMessageTimestamp(msg.id);
                  return (
                    <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          msg.role === "user"
                            ? "imei-copilot-msg imei-copilot-msg--user"
                            : "imei-copilot-msg imei-copilot-msg--assistant"
                        }
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === "assistant" && msg.executedNavigation ? (
                          <ExecutedNavigationConfirmation
                            executed={msg.executedNavigation}
                            currentPathname={location.pathname}
                            currentSearch={location.search}
                            onNavigateAgain={(pathname, search) => {
                              navigate({ pathname, ...(search ? { search } : {}) });
                            }}
                          />
                        ) : null}
                        {msg.role === "assistant" && msg.actions && msg.actions.length > 0 ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {msg.actions.map((action) => (
                              <button
                                key={`${msg.id}-${action.path}`}
                                type="button"
                                onClick={() => {
                                  navigate(action.path);
                                  setOpen(false);
                                }}
                                className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-brand-200/90 hover:bg-brand-50/80 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/25"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {msg.role === "assistant" ? (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-200/35 pt-2">
                            <p className="text-[10px] font-medium text-slate-500/95">{msg.grounded ? "Grounded answer" : "General guidance"}</p>
                            {ttsSupported ? (
                              <button
                                type="button"
                                onClick={() => speak(msg.content, msg.id)}
                                className={[
                                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition duration-200",
                                  speakingMessageId === msg.id
                                    ? "border-brand-300/80 bg-brand-50 text-brand-800 shadow-sm"
                                    : "border-slate-200/90 bg-white/90 text-slate-600 hover:border-brand-200 hover:text-brand-800",
                                ].join(" ")}
                                aria-label={speakingMessageId === msg.id ? "Stop speaking message" : "Speak message"}
                              >
                                {speakingMessageId === msg.id ? "Stop audio" : "Speak"}
                              </button>
                            ) : null}
                            {timeLabel ? <p className="ml-auto text-[10px] tabular-nums text-slate-400">{timeLabel}</p> : null}
                          </div>
                        ) : timeLabel ? (
                          <p className="mt-2 text-right text-[10px] tabular-nums text-white/45">{timeLabel}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {busy ? <TypingIndicator /> : null}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <footer className="imei-copilot-footer shrink-0 px-3 pb-3 pt-2.5">
            {suggestedPrompts.length > 0 ? (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestedPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={`quick-${prompt}`}
                    type="button"
                    onClick={() => void submitMessage(prompt)}
                    className="imei-copilot-pill imei-copilot-pill--inline"
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
                <div className="relative min-w-0 flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about inventory, orders, returns, suppliers…"
                    className="imei-copilot-input w-full"
                    disabled={busy}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearSpeechError();
                    toggleListening();
                  }}
                  disabled={!speechSupported || busy}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  className={["imei-copilot-mic", isListening ? "imei-copilot-mic--live" : null, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2"].filter(Boolean).join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3z" />
                    <path d="M5 11.5a7 7 0 0014 0M12 18.5V21M9 21h6" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="imei-copilot-send inline-flex shrink-0 items-center justify-center"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 min-h-[1.1rem] text-[10px]">
                {isListening ? (
                  <p className="inline-flex items-center gap-1.5 text-red-600/95">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    Listening…
                    {interimTranscript ? <span className="font-normal text-slate-500">“{interimTranscript}”</span> : null}
                  </p>
                ) : !speechSupported ? (
                  <p className="text-slate-400/90">Voice input is not supported in this browser.</p>
                ) : null}
              </div>
            </form>
          </footer>
        </section>
      ) : null}
    </>,
    document.body,
  );
}
