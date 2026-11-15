import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rivet · Hiring, both ways",
    template: "%s · Rivet",
  },
  description:
    "An interviewer-first pre-screening demo for Junction 2026. Stated bars, versioned work samples, checkable claims, conversation kits and human decisions. No CV keyword scan, no AI detector, no auto-reject. All data is synthetic.",
  applicationName: "Rivet",
};

export const viewport: Viewport = {
  themeColor: "#0E141E",
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
              border: "1px solid #DCE3E8",
              color: "#0E141E",
              borderRadius: "8px",
              boxShadow: "0 18px 40px -32px rgba(14,20,30,.35)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}