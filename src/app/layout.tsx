import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { siteConfig, getSiteUrl } from "@/lib/site";
import "./globals.css";

const jakartaSans = localFont({
  variable: "--font-jakarta-sans",
  display: "swap",
  src: [
    {
      path: "../assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2",
      weight: "200 800",
    },
  ],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  display: "swap",
  src: [
    {
      path: "../assets/fonts/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../assets/fonts/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../assets/fonts/ibm-plex-mono-latin-600-normal.woff2",
      weight: "600",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
