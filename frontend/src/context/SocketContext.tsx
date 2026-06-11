"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  currentRoom: any;
  setCurrentRoom: (room: any) => void;
  nickname: string;
  setNickname: (name: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  currentRoom: null,
  setCurrentRoom: () => {},
  nickname: "",
  setNickname: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [nickname, setNickname] = useState<string>("");

  useEffect(() => {
    // Busca a variável de ambiente, com fallback de segurança pro localhost
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const newSocket = io(backendUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, currentRoom, setCurrentRoom, nickname, setNickname }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);