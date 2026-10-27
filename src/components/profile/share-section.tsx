import Image from "next/image";
import { ShareBar } from "@/components/profile/share-bar";

interface Props {
  url: string;
  login: string;
  text: string;
  cardBase: string;
}

const cards = [
  { label: "Link preview", size: "1200×630", format: "og", w: 228, h: 120 },
  { label: "Square", size: "1080×1080", format: "square", w: 120, h: 120 },
  { label: "Story", size: "1080×1920", format: "story", w: 68, h: 120 },
];

export function ShareSection({ url, login, text, cardBase }: Props) {
  return (
    <section
      id="share"
      className="border-border mt-14 scroll-mt-20 border-t pt-12 text-center"
    >
      <span className="label block">Share</span>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">
        Brag about it
      </h2>
      <div className="mt-8 flex flex-wrap items-start justify-center gap-5">
        {cards.map((c) => (
          <a
            key={c.format}
            href={`${cardBase}.png?format=${c.format}&download=1`}
            className="group flex flex-col items-center gap-2"
            title={`Download the ${c.label.toLowerCase()} card`}
          >
            <Image
              unoptimized
              src={`${cardBase}.png?format=${c.format}`}
              alt={`${c.label} card`}
              width={c.w}
              height={c.h}
              className="border-border rounded-md border shadow-sm transition-transform group-hover:-translate-y-0.5"
            />
            <span className="text-muted-foreground font-mono text-[11px]">
              {c.label} · {c.size}
            </span>
          </a>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-3xl text-left">
        <ShareBar
          url={url}
          login={login}
          text={text}
          cardBase={cardBase}
          showCards={false}
        />
      </div>
    </section>
  );
}
