"use client";

import { Check, Copy, Download, Link2, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandIcon, type Brand } from "@/components/profile/brand-icons";
import { cn } from "@/lib/utils";

interface ShareBarProps {
  url: string;
  login: string;
  text: string;
  cardBase: string;
  showCards?: boolean;
}

const networks = (
  url: string,
  text: string,
): { name: Brand; href: string }[] => [
  {
    name: "X",
    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Threads",
    href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    name: "Bluesky",
    href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    name: "Reddit",
    href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    name: "WhatsApp",
    href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    name: "Telegram",
    href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export function ShareBar({
  url,
  login,
  text,
  cardBase,
  showCards = true,
}: ShareBarProps) {
  const [copied, setCopied] = useState<"link" | "badge" | null>(null);
  const badge = `[![Open-source contributions](${cardBase}.svg)](${url})`;

  async function copy(value: string, kind: "link" | "badge") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copy this", value);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${login} on GitBrag`, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copy(url, "link");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={nativeShare} size="sm">
            <Share2 /> Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => copy(url, "link")}>
            {copied === "link" ? <Check /> : <Link2 />}{" "}
            {copied === "link" ? "Copied" : "Copy link"}
          </Button>
        </div>
        <ul className="flex flex-wrap justify-center gap-2">
          {networks(url, text).map((n) => (
            <li key={n.name}>
              <a
                href={n.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Share on ${n.name}`}
                title={n.name}
                className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground grid size-9 place-items-center rounded-md border transition-colors"
              >
                <BrandIcon name={n.name} className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      {showCards ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Link preview · 1200×630", format: "og" },
            { label: "Square · 1080×1080", format: "square" },
            { label: "Story · 1080×1920", format: "story" },
          ].map((card) => (
            <a
              key={card.format}
              href={`${cardBase}.png?format=${card.format}&download=1`}
              className="border-border bg-card hover:bg-muted flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-xs"
            >
              <span className="text-muted-foreground font-mono">
                {card.label}
              </span>
              <Download className="size-3.5" />
            </a>
          ))}
        </div>
      ) : null}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label">README badge</span>
          <button
            type="button"
            onClick={() => copy(badge, "badge")}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-[11px]",
            )}
          >
            {copied === "badge" ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied === "badge" ? "Copied" : "Copy markdown"}
          </button>
        </div>
        <pre className="border-border bg-muted text-muted-foreground overflow-x-auto rounded-md border p-3 font-mono text-[11px]">
          {badge}
        </pre>
      </div>
    </div>
  );
}
