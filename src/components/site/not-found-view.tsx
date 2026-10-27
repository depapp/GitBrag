import Image from "next/image";
import notFound from "@/assets/icons/not-found.png";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";

export function NotFoundView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col px-2">
          <div className="border-border relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center border-x">
            <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 md:py-14">
              <Image
                src={notFound}
                alt=""
                priority
                className="mb-5 size-24 md:size-28"
              />
              <span className="border-border text-foreground inline-flex items-center border px-3 py-1 font-mono text-xs tracking-[0.08em] uppercase md:text-sm">
                404 · Not found
              </span>
              <h1 className="mt-4 max-w-3xl text-center text-[2rem] leading-9 tracking-tighter text-balance sm:text-5xl sm:leading-tight lg:text-6xl">
                {title}
              </h1>
              <p className="text-muted-foreground mt-4 max-w-prose text-center text-sm tracking-tight text-balance lg:text-base">
                {description}
              </p>
              <ButtonLink href="/" variant="raised" className="mt-10">
                Back home
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
