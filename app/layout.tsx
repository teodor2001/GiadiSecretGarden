import type { Metadata } from "next";
import { Quicksand } from "next/font/google"; 
import "./globals.css";

const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Giadi's Secret Garden",
  description: "A quiet place to focus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning> 
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}