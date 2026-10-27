"use client";

import { Loader2, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import type { UserSuggestion } from "@/lib/github/types";
import { cn } from "@/lib/utils";

const USERNAME_RE = /^@?[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function UserSearch({
  size = "lg",
  autoFocus = false,
  className,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = value.trim().replace(/^@/, "");
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      if (term.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search-users?q=${encodeURIComponent(term)}`,
          {
            signal: controller.signal,
          },
        );
        const json = (await res.json()) as { users: UserSuggestion[] };
        if (!controller.signal.aborted) {
          setSuggestions(json.users ?? []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        /* aborted or offline: keep the previous list */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(login: string) {
    const clean = login.trim().replace(/^@/, "");
    if (!USERNAME_RE.test(clean)) {
      setError("Enter a valid GitHub username.");
      return;
    }
    setError(null);
    setOpen(false);
    startTransition(() => router.push(`/u/${encodeURIComponent(clean)}`));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) go(suggestions[active].login);
    else go(value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const tall = size === "lg";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={onSubmit}
        role="search"
        className={cn(
          "border-border-strong bg-card focus-within:ring-ring flex items-center gap-2 border p-1.5 transition-shadow focus-within:ring-2",
          tall ? "h-14" : "h-11",
        )}
      >
        <span className="text-muted-foreground flex items-center pl-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
        </span>
        <input
          type="text"
          name="username"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="GitHub username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className={cn(
            "text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent focus:outline-none",
            tall ? "text-base" : "text-sm",
          )}
        />
        <Button
          type="submit"
          variant="raised"
          size={tall ? "md" : "sm"}
          disabled={pending}
          className={cn(
            "mr-0.5 font-mono text-xs tracking-[0.08em] uppercase",
            tall ? "h-10" : "h-8",
          )}
        >
          {pending ? <Loader2 className="animate-spin" /> : null}
          Brag
        </Button>
      </form>
      {error ? <p className="text-negative mt-2 text-sm">{error}</p> : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-card absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden border shadow-lg"
        >
          {suggestions.map((user, i) => (
            <li key={user.login} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(user.login)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                  i === active ? "bg-muted" : "hover:bg-muted",
                )}
              >
                <Image
                  src={user.avatarUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 rounded-full"
                />
                <span className="font-medium">{user.login}</span>
                {user.name ? (
                  <span className="text-muted-foreground truncate">
                    {user.name}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
