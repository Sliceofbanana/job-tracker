import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./authprovider";
import SecurityProvider from "./components/SecurityProvider";

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
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com https://vercel.live https://vitals.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: https://*.googleusercontent.com; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com wss://*.firebaseapp.com https://*.firebaseio.com https://*.cloudfunctions.net; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; child-src 'self' https://accounts.google.com https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self';"
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
      </head>
      <body>
        <AuthProvider>
          <SecurityProvider>
            {children}
          </SecurityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}