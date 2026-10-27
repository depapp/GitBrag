export function SiteFooter() {
  return (
    <footer className="bg-background px-2 pb-2">
      <div className="border-border text-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 border-x border-t px-4 py-4 font-mono text-xs uppercase md:text-sm lg:h-16 lg:flex-row lg:py-0">
        <span>© {new Date().getFullYear()} GitBrag. MIT licensed.</span>
        <span>
          Supported by{" "}
          <a
            href="https://pamerin.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent underline underline-offset-4 transition-colors"
          >
            Pamerin
          </a>
        </span>
      </div>
    </footer>
  );
}
