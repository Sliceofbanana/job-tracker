import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Job Tracker",
  icons: {
    icon: "/footsteps.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/footsteps.ico" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/sketch.js/1.0/sketch.min.js"></script>
        <script src="/skylines.js" defer></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <canvas id="background-canvas" className="canvas-bg"></canvas>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}