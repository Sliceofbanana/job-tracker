import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./authprovider";

export const metadata: Metadata = {
  title: "Job Tracker",
  icons: {
    icon: "/footsteps.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: https://*.googleusercontent.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com wss://*.firebaseapp.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; child-src 'self' https://accounts.google.com https://*.firebaseapp.com; object-src 'none';"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}