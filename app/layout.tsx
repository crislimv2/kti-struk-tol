import type { Metadata } from "next";
import { Geist, Ubuntu_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "KTI Struk Tol",
  description:
    "Cetak struk gerbang tol ke printer thermal 80mm untuk armada Kristal Transport Indonesia",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

/** Monospace sempit (advance 0.5em) yang mendekati font thermal ESC/POS untuk pratinjau struk. */
const fontThermal = Ubuntu_Mono({
  variable: "--font-thermal",
  weight: ["400", "700"],
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.className} ${fontThermal.variable} antialiased`}>
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
