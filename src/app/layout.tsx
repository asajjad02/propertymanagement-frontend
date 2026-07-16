import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { InlineScript } from "@/components/util/inline-script";

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Atrium",
  description: "Atrium — the calm command center for your property.",
};

/*
 * Set the theme before first paint to avoid a flash. Reads the persisted
 * preference; if none, the CSS falls back to the OS `prefers-color-scheme`.
 */
const themeBootstrap = `(function(){try{var t=localStorage.getItem('hr.theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <InlineScript html={themeBootstrap} />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> after SSR, which would otherwise trip a
          hydration mismatch. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
