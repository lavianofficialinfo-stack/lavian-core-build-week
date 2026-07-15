import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L’avian Core | Build Week Demo",
  description:
    "One request in. A coordinated business workflow out. Human judgment only where it matters.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
