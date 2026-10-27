import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent/90",
        raised:
          "bg-accent text-accent-fg rounded-lg -translate-y-0.5 shadow-[0_4px_0_var(--color-accent-edge),0_8px_14px_var(--color-accent-glow)] transition-[transform,box-shadow,background-color] hover:-translate-y-1 hover:shadow-[0_6px_0_var(--color-accent-edge),0_12px_18px_var(--color-accent-glow)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-accent-edge),0_2px_6px_var(--color-accent-glow)]",
        outline:
          "border border-border-strong text-foreground hover:bg-foreground/[0.04]",
        ghost: "text-muted-foreground hover:text-foreground",
        subtle: "bg-muted text-foreground hover:bg-border-strong/40",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-9 rounded-md border border-border",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & { children: ReactNode };

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
