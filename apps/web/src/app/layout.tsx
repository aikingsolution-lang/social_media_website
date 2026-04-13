import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/providers/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "30×30×30 Social Automation",
  description: "Upload 30 videos, connect 30 accounts, automate 30 days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} app-shell app-grid-bg antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}