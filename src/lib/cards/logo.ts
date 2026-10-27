import { readFile } from "node:fs/promises";
import path from "node:path";

let cached: Promise<string> | null = null;

/** GitBrag mark as a data URI for `ImageResponse`; read from the repo so builds work offline. */
export function loadCardLogo() {
  cached ??= readFile(
    path.join(process.cwd(), "src", "assets", "logo-mark.png"),
  ).then((buf) => `data:image/png;base64,${buf.toString("base64")}`);
  return cached;
}
