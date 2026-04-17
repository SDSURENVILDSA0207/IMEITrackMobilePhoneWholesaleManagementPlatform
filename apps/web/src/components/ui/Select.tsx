import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { getOpenSelectId, notifySelectOpen, subscribeSelectOpen } from "@/components/ui/selectCoordinator";

import "./select.css";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function Select({
  id: idProp,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className = "",
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}: SelectProps) {
  const reactId = useId();
  const instanceId = `sel-${reactId.replace(/:/g, "")}`;
  const listboxId = `${instanceId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeSelectOpen(() => {
      setOpen(getOpenSelectId() === instanceId);
    });
  }, [instanceId]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const panel = panelRef.current;
    if (!panel) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const maxH = 280;
    const spaceBelow = window.innerHeight - r.bottom - gap - 8;
    panel.style.position = "fixed";
    panel.style.left = `${r.left}px`;
    panel.style.top = `${r.bottom + gap}px`;
    panel.style.width = `${r.width}px`;
    panel.style.maxHeight = `${Math.min(maxH, Math.max(120, spaceBelow))}px`;
    panel.style.zIndex = "300";
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(raf);
  }, [open, updatePosition, value]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      notifySelectOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        notifySelectOpen(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;

  const toggle = () => {
    if (disabled) return;
    if (getOpenSelectId() === instanceId) notifySelectOpen(null);
    else notifySelectOpen(instanceId);
  };

  const id = idProp ?? instanceId;

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            className="app-select-panel"
            aria-activedescendant={value ? `${id}-opt-${value}` : undefined}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const optSlug = opt.value === "" ? "empty" : opt.value;
              return (
                <button
                  key={`${optSlug}-${opt.label}`}
                  type="button"
                  id={`${id}-opt-${optSlug}`}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected ? "true" : "false"}
                  className="app-select-option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.value);
                    notifySelectOpen(null);
                    triggerRef.current?.focus();
                  }}
                >
                  <span className="app-select-option__check" aria-hidden>
                    {isSelected ? <Check className="h-3.5 w-3.5 text-brand-600" strokeWidth={2.5} /> : null}
                  </span>
                  <span className={opt.value === "" ? "text-slate-500" : "text-slate-800"}>{opt.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        disabled={disabled}
        className="app-select-trigger app-select-trigger--button"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            notifySelectOpen(instanceId);
          }
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left">{display}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}
