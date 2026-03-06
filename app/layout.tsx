import type { Metadata, Viewport } from "next";
import { Nunito, Fredoka_One } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});
const fredoka = Fredoka_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buddy Tutor – AI Study Pal for Grade 3-5",
  description: "Upload your textbook chapter and let Buddy teach it in a fun, step-by-step way!",
  manifest: "/manifest.json",
  keywords: ["kids tutor", "AI education", "grade 3 4 5", "homework help", "India", "Gemini"],
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Buddy Tutor" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2ECC71",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-nunito" style={{ background: "#f5f4ff" }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{ style: { fontFamily: "var(--font-nunito)", fontWeight: 700, borderRadius: 16 } }}
        />
      </body>
    </html>
  );
}
