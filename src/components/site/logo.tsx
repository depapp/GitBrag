import Image from "next/image";
import logo from "@/assets/logo.png";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Image
        src={logo}
        alt=""
        aria-hidden
        width={28}
        height={28}
        priority
        className="size-7"
      />
      <span className="text-foreground text-[15px] font-semibold tracking-tight">
        GitBrag
      </span>
    </Link>
  );
}
