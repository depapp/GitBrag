import { readFile } from "node:fs/promises";
import path from "node:path";

const fontDir = path.join(process.cwd(), "src", "assets", "fonts");

let cached: Promise<
  Array<{
    name: string;
    data: ArrayBuffer;
    weight: 400 | 600 | 800 | 500;
    style: "normal";
  }>
> | null = null;

/** Fonts for `ImageResponse`; loaded from the repo so builds work offline. */
export function loadCardFonts() {
  cached ??= Promise.all([
    load("inter-latin-400-normal.woff", "Inter", 400),
    load("inter-latin-600-normal.woff", "Inter", 600),
    load("inter-latin-800-normal.woff", "Inter", 800),
    load("jetbrains-mono-latin-500-normal.woff", "JetBrains Mono", 500),
  ]);
  return cached;
}

async function load(file: string, name: string, weight: 400 | 600 | 800 | 500) {
  const buf = await readFile(path.join(fontDir, file));
  return {
    name,
    weight,
    style: "normal" as const,
    data: buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer,
  };
}
