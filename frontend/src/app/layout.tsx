import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/context/LanguageContext";
import { GameProvider } from "@/context/GameContext";
import SupportButton from "@/components/SupportButton";
import { SocketProvider } from "@/context/SocketContext"; // <-- Importe o SocketProvider
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "vs11",
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
        <AuthProvider>
          <SocketProvider>
            <LanguageProvider>
              <GameProvider>
                {children}
                <SupportButton />
              </GameProvider>
            </LanguageProvider>
          </SocketProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}