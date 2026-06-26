import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NMCT Student Tracking Portal - Tribal Education Lifecycle Tracking",
  description:
    "Secure role-based Field Officer Admin Portal for tracking the educational lifecycle of tribal students, by Native Medicare Charitable Trust.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
      )}
    >
      <body className="min-h-screen antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
