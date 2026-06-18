"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

interface SocketContextType {
  socket: Socket | null;
  currentRoom: any;
  setCurrentRoom: (room: any) => void;
  nickname: string;
  setNickname: (name: string) => void;
  saveSession: (roomId: string) => void;
  clearSession: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  currentRoom: null,
  setCurrentRoom: () => {},
  nickname: "",
  setNickname: () => {},
  saveSession: () => {},
  clearSession: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [nickname, setNickname] = useState<string>("");
  const hasAttemptedRejoin = useRef(false);
  const { user } = useAuth();

  // Pre-fill nickname from logged-in account when no session nickname exists
  useEffect(() => {
    if (user) {
      try {
        const savedNickname = sessionStorage.getItem("16a0_nickname");
        if (!savedNickname) {
          setNickname(user.nickname);
        }
      } catch {
        setNickname(user.nickname);
      }
    }
  }, [user]);

  // Persiste o nickname no sessionStorage sempre que mudar
  const handleSetNickname = useCallback((name: string) => {
    setNickname(name);
    if (name) {
      try { sessionStorage.setItem("16a0_nickname", name); } catch {}
    }
  }, []);

  // Salva a sessão (roomId + nickname) para reconexão
  const saveSession = useCallback((roomId: string) => {
    try {
      sessionStorage.setItem("16a0_roomId", roomId);
      if (nickname) {
        sessionStorage.setItem("16a0_nickname", nickname);
      }
    } catch {}
  }, [nickname]);

  // Limpa a sessão (ao sair da sala ou voltar ao menu)
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem("16a0_roomId");
    } catch {}
  }, []);

  useEffect(() => {
    // Restaura o nickname do sessionStorage ao montar
    try {
      const savedNickname = sessionStorage.getItem("16a0_nickname");
      if (savedNickname) setNickname(savedNickname);
    } catch {}

    // Busca a variável de ambiente, com fallback de segurança pro localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const newSocket = io(backendUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-rejoin ao reconectar
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      try {
        const savedRoomId = sessionStorage.getItem("16a0_roomId");
        const savedNickname = sessionStorage.getItem("16a0_nickname");

        if (savedRoomId && savedNickname && !hasAttemptedRejoin.current) {
          hasAttemptedRejoin.current = true;
          
          socket.emit("rejoinRoom", { nickname: savedNickname, roomId: savedRoomId }, (response: any) => {
            hasAttemptedRejoin.current = false;
            if (response.success) {
              setCurrentRoom(response.room);
              setNickname(savedNickname);
            }
            // Se falhou, não faz nada — o fluxo normal do lobby tratará
          });
        }
      } catch {}
    };

    // Se já estiver conectado, tenta rejoin imediatamente
    if (socket.connected) {
      handleConnect();
    }

    // Escuta reconexões futuras (quando o usuário volta ao navegador)
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, currentRoom, setCurrentRoom, nickname, setNickname: handleSetNickname, saveSession, clearSession }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);