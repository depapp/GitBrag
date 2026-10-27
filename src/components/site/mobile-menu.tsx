"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function MobileMenu({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border-border text-foreground grid size-9 place-items-center rounded-md border [&_svg]:size-4"
      >
        {open ? <X /> : <Menu />}
      </button>
      {open ? (
        <nav className="border-border bg-background absolute inset-x-0 top-14 z-50 border-b">
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-foreground flex h-12 items-center text-sm font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
