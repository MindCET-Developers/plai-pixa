import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Open_Sans } from "next/font/google";
import "./globals.css";

// Only production traffic is measured, so local and preview runs don't skew the GA4 numbers.
const GA_MEASUREMENT_ID = "G-4TSGNB6WTH";
const isProduction = process.env.VERCEL_ENV === "production";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "PIXA — המשחק שבו דמיון, יצירתיות ובינה מלאכותית נפגשים",
  description:
    "PIXA נועד ללמד תלמידים כיצד לנסח הנחיות מדויקות וברורות לבינה מלאכותית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-pixa-ink bg-pixa-light">
        {children}
      </body>
      {isProduction && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
