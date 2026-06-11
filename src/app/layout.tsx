import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { GameProvider } from "@/context/GameContext";
import SupportButton from "@/components/SupportButton"; // <-- 1. Importe o componente

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "16a0 - The Draft Game",
  description: "Construa seu elenco e conquiste o campeonato.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LanguageProvider>
          <GameProvider>
            {children}
            <SupportButton /> {/* <-- 2. Adicione ele aqui! */}
          </GameProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}