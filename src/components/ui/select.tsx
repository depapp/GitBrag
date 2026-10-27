"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  "aria-label": string;
  className?: string;
}

export function Select({
  value,
  options,
  onChange,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) show();
        else setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) show();
        else setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (!open) break;
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        if (!open) break;
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else show();
        break;
      case "Escape":
        if (!open) break;
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "bg-card border-border hover:border-border-strong focus-visible:border-accent flex h-9 w-full items-center gap-2 rounded-md border px-3 font-mono text-xs transition-colors outline-none",
          open && "border-border-strong",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selected?.label}
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </button>
      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="bg-card border-border absolute top-full left-0 z-30 mt-1 max-h-64 min-w-full overflow-auto rounded-md border p-1 font-mono text-xs shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 whitespace-nowrap",
                i === active && "bg-muted",
                o.value === value ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Check
                className={cn(
                  "size-3.5 shrink-0",
                  o.value === value ? "text-accent" : "invisible",
                )}
              />
              <span className="truncate">{o.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
