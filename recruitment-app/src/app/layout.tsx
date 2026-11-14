import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rivet — Hiring, both ways",
    template: "%s · Rivet",
  },
  description:
    "A two-sided, evidence-honest recruitment event prototype for Junction 2026. Prompt profiles, mutual matches, free roses, and approved tailoring. All data is synthetic.",
  applicationName: "Rivet",
};

export const viewport: Viewport = {
  themeColor: "#F8F4ED",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          closeButton
          toastOptions={{
            style: {
              background: "#FFFCF8",
              border: "1px solid #E4D9CC",
              color: "#1B1714",
              borderRadius: "16px",
              boxShadow: "0 20px 45px -30px rgba(37,27,20,.45)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
