"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="bg-card border-border text-foreground grid size-9 -translate-y-0.5 place-items-center rounded-lg border shadow-[0_3px_0_var(--color-border-strong)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_4px_0_var(--color-border-strong)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-border-strong)] [&_svg]:size-4"
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </button>
  );
}
