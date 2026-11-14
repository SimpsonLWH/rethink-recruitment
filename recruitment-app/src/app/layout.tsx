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
    "A two-sided, evidence-honest recruitment event prototype for Junction 2026. Prompt profiles, mutual interest, priority intros, recruiter review and approved tailoring. All data is synthetic.",
  applicationName: "Rivet",
};

export const viewport: Viewport = {
  themeColor: "#F7F5F0",
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
              background: "#FFFFFF",
              border: "1px solid #E4E0D8",
              color: "#171717",
              borderRadius: "14px",
              boxShadow: "0 18px 40px -32px rgba(23,23,23,.35)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
