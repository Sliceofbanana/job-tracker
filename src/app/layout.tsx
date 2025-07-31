import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./authprovider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


export const metadata: Metadata = {
  title: "Job Tracker",
  icons: {
    icon: "/footsteps.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}