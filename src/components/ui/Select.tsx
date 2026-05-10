"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  listClassName?: string;
};

export function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  buttonClassName = "",
  listClassName = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "Select";
  const listId = id ? `${id}-list` : undefined;

  const openWithActiveIdx = () => {
    if (!disabled) {
      const idx = options.findIndex((opt) => opt.value === value);
      setActiveIdx(idx >= 0 ? idx : 0);
      setOpen((v) => !v);
    }
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectIndex(idx: number) {
    const option = options[idx];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (activeIdx >= 0) selectIndex(activeIdx);
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={openWithActiveIdx}
        onKeyDown={handleKeyDown}
        className={`relative w-full rounded-[12px] border border-[var(--up-border-mid)] bg-[var(--up-surface-2)] px-3 py-2 pr-9 text-left text-[var(--up-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(163,230,53,0.35)] ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-[rgba(163,230,53,0.35)]"
        } ${buttonClassName}`}
      >
        <span className="block truncate">{displayLabel}</span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--up-muted)]">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[12px] border border-[var(--up-border)] bg-[var(--up-surface)] shadow-2xl shadow-black/30 ${listClassName}`}
        >
          {options.map((opt, idx) => {
            const isActive = idx === activeIdx;
            const isSelected = opt.value === value;
            return (
              <li key={`${opt.value}-${idx}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => selectIndex(idx)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                    opt.disabled ? "cursor-not-allowed opacity-50" : ""
                  } ${
                    isActive
                      ? "bg-[var(--up-accent-bg)] text-[var(--up-accent)]"
                      : "text-[var(--up-text)] hover:bg-[var(--up-accent-bg)]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? (
                    <span className="ml-2 text-[var(--up-accent)]">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
