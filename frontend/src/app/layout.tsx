import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { GameProvider } from "@/context/GameContext";
import SupportButton from "@/components/SupportButton";
import { SocketProvider } from "@/context/SocketContext"; // <-- Importe o SocketProvider

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
        <SocketProvider>
          <LanguageProvider>
            <GameProvider>
              {children}
              <SupportButton />
            </GameProvider>
          </LanguageProvider>
        </SocketProvider>
      </body>
    </html>
  );
}