import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "16-0 | Football Simulation",
  description:
    "Build your dream squad and conquer Europe in this premium football simulation game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-plum-dark min-h-screen`}>
        <LanguageProvider>
          <GameProvider>{children}</GameProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}