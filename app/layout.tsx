import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppThemeProvider } from "@/components/AppThemeProvider";
import { AppAccountProvider } from "@/components/AppAccountProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://flowex-snowy.vercel.app"
  ),
  title: {
    default: "Flowex | Automated Lead Capture & Follow-Up",
    template: "%s | Flowex",
  },
  description:
    "Capture leads from your forms and automate email follow-up, notifications, and integrations with Flowex.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Flowex",
    title: "Flowex | Automated Lead Capture & Follow-Up",
    description:
      "Capture leads from your forms and automate email follow-up, notifications, and integrations with Flowex.",
    images: [{ url: "/flowex-logo-brand.png", alt: "Flowex" }],
  },
  twitter: {
    card: "summary",
    title: "Flowex | Automated Lead Capture & Follow-Up",
    description:
      "Capture leads from your forms and automate email follow-up, notifications, and integrations with Flowex.",
    images: ["/flowex-logo-brand.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/flowex-logo-brand.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        <AppThemeProvider>

          <AppAccountProvider>
          {children}
          </AppAccountProvider>


        </AppThemeProvider>
        
      </body>
    </html>
  );
}
