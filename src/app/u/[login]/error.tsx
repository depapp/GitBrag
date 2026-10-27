"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/site-header";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="w-full px-4 sm:px-6">
          <div className="border-border mx-auto flex w-full max-w-6xl flex-col items-center justify-center border-x px-6 py-24 text-center sm:px-10">
            <span className="label">Something went wrong</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              We could not load this profile.
            </h1>
            <p className="text-muted-foreground mt-3">
              {error.message ||
                "GitHub did not answer in time. This usually clears up within a minute."}
            </p>
            <div className="mt-8 flex gap-3">
              <Button onClick={reset}>Try again</Button>
              <ButtonLink href="/" variant="outline">
                Back home
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
