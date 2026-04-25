import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Amaterest",
  description: "Projet Next.js autonome pour publier des pins Pinterest relies a des liens Amazon.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon-512.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
