"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";

export default function OnlinePage() {
  const router = useRouter();
  const { socket, setNickname, nickname, setCurrentRoom, saveSession } = useSocket();
  const { clearSave } = useGame();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"buscar" | "criar">("buscar");
  const [showRankedModal, setShowRankedModal] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [roomName, setRoomName] = useState("");
  const [mode, setMode] = useState("tradicional");
  const [tournamentMode, setTournamentMode] = useState("super-mundial");
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  // NOVO: Opções exclusivas do Modo Tradicional
  const [draftMode, setDraftMode] = useState("classic");
  const [difficulty, setDifficulty] = useState("medium");
  const [isRanked, setIsRanked] = useState(false);

  const [joinPassword, setJoinPassword] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const refreshRooms = () => {
    socket?.emit("requestRooms");
  };

  useEffect(() => {
    if (!socket) return;

    const onRoomsList = (availableRooms: any[]) => {
      setRooms(availableRooms);
    };

    socket.on("roomsList", onRoomsList);

    if (socket.connected) {
      refreshRooms();
    } else {
      socket.on("connect", refreshRooms);
    }

    return () => {
      socket.off("roomsList", onRoomsList);
      socket.off("connect", refreshRooms);
    };
  }, [socket]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) return alert("Digite um nickname no topo da página!");
    
    // Enviando as novas opções
    socket?.emit("createRoom", { roomName, nickname, mode, tournamentMode, draftMode, difficulty, isRanked, password: hasPassword ? password : null }, (response: any) => {
      if (response.success) {
        clearSave();
        saveSession(response.roomId);
        router.push(`/lobby/${response.roomId}`);
      }
    });
  };

  const handleJoinRoom = (roomId: string, reqPassword: boolean, roomIsRanked?: boolean) => {
    if (!nickname) return alert("Digite um nickname no topo da página!");
    if (roomIsRanked && !user) {
      setShowRankedModal(true);
      return;
    }
    if (reqPassword && !joinPassword) {
      setSelectedRoomId(roomId);
      return;
    }

    socket?.emit("joinRoom", { roomId, nickname, password: joinPassword }, (response: any) => {
      if (response.success) {
        clearSave();
        saveSession(response.roomId);
        router.push(`/lobby/${response.roomId}`);
      } else {
        alert(response.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#00183F] p-6 text-white font-sans flex flex-col items-center relative">
      <button 
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 bg-white text-[#00183F] px-4 py-2 font-black uppercase text-sm border-4 border-transparent hover:border-amber-400 hover:-translate-y-1 transition-all"
      >
        ← Voltar
      </button>

      <h1 className="text-5xl font-black uppercase mb-8 mt-12 md:mt-0 drop-shadow-[4px_4px_0_#0033A0]">Multiplayer Online</h1>

      <div className="bg-white text-[#00183F] w-full max-w-4xl p-6 border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0]">
        
        <div className="mb-6">
          <label className="block font-black uppercase mb-2">Seu Nickname</label>
          <input 
            type="text" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border-4 border-[#00183F] p-3 font-bold uppercase bg-gray-100" 
            placeholder="Ex: GabrielDiniz"
          />
        </div>

        <div className="flex gap-4 border-b-4 border-[#00183F] mb-6">
          <button 
            className={`flex-1 py-3 font-black uppercase text-xl ${activeTab === "buscar" ? "bg-[#00183F] text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
            onClick={() => {
              setActiveTab("buscar");
              refreshRooms();
            }}
          >
            Buscar Salas
          </button>
          <button 
            className={`flex-1 py-3 font-black uppercase text-xl ${activeTab === "criar" ? "bg-[#00183F] text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
            onClick={() => setActiveTab("criar")}
          >
            Criar Sala
          </button>
        </div>

        {activeTab === "buscar" ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl uppercase">Salas Disponíveis</h3>
              <button 
                onClick={refreshRooms}
                className="bg-[#00183F] text-white px-4 py-2 font-black uppercase text-sm border-2 border-transparent hover:border-amber-400 hover:text-amber-400 transition-colors"
              >
                Atualizar 🔄
              </button>
            </div>

            {rooms.length === 0 ? (
              <p className="text-center font-bold text-gray-500 py-10 bg-gray-100 border-2 border-dashed border-gray-300">Nenhuma sala disponível no momento.</p>
            ) : (
              <div className="grid gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="border-4 border-[#00183F] p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#D9D9D9] gap-4">
                    <div>
                      <h3 className="font-black text-xl uppercase">
                        {room.name}
                        <span className="text-sm bg-[#00183F] text-white px-2 py-1 ml-2">{room.mode}</span>
                        {room.tournamentMode && room.tournamentMode !== 'super-mundial' && (
                          <span className="text-xs bg-amber-400 text-[#00183F] px-2 py-1 ml-1 font-black uppercase border-2 border-[#00183F]">
                            { { 'copa-do-mundo': '🌍 Copa', 'brasileirao': '🇧🇷 Brasileirão', 'louco': '🔥 Louco' }[room.tournamentMode as string] }
                          </span>
                        )}
                        {room.isRanked && (
                          <span className="text-xs bg-amber-500 text-white px-2 py-1 ml-1 font-black uppercase border-2 border-[#00183F]">
                            🏆 Rankeada
                          </span>
                        )}
                      </h3>
                      <p className="font-bold text-sm text-gray-600 mt-1">{room.players.length}/{room.maxPlayers} Jogadores {room.hasPassword && '🔒'}</p>
                    </div>
                    
                    {selectedRoomId === room.id ? (
                      <div className="flex gap-2 w-full md:w-auto">
                        <input 
                          type="password" 
                          placeholder="Senha" 
                          className="border-2 border-[#00183F] px-2 w-full"
                          onChange={(e) => setJoinPassword(e.target.value)}
                        />
                        <button onClick={() => handleJoinRoom(room.id, true, room.isRanked)} className="bg-emerald-500 px-4 py-2 font-black border-2 border-[#00183F]">Entrar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinRoom(room.id, room.hasPassword, room.isRanked)}
                        className="bg-[#00183F] text-white px-6 py-2 font-black uppercase hover:scale-105 transition-transform border-2 border-black w-full md:w-auto"
                      >
                        Entrar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block font-black uppercase mb-1">Nome da Sala</label>
              <input type="text" className="w-full border-4 border-[#00183F] p-2 font-bold bg-gray-50" value={roomName} onChange={e => setRoomName(e.target.value)} required />
            </div>
            
            <div>
              <label className="block font-black uppercase mb-1">Modo de Jogo</label>
              <select className="w-full border-4 border-[#00183F] p-2 font-bold bg-gray-50 uppercase" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="tradicional">Tradicional (Pontos Corridos + Mata-mata)</option>
                <option value="guerra">Guerra (Chaveamento Direto PvP)</option>
              </select>
            </div>

            <div>
              <label className="block font-black uppercase mb-1">Modo de Torneio</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "super-mundial", label: "⚽ Super Mundial", desc: "Clubes do mundo todo" },
                  { value: "copa-do-mundo", label: "🌍 Copa do Mundo", desc: "Apenas seleções nacionais" },
                  { value: "brasileirao", label: "🇧🇷 Brasileirão", desc: "Apenas clubes brasileiros" },
                  { value: "louco", label: "🔥 Louco", desc: "Todos os times, 32 na sorte" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTournamentMode(opt.value)}
                    className={`flex flex-col text-left p-3 border-4 font-bold transition-all duration-75 ${
                      tournamentMode === opt.value
                        ? "bg-[#00183F] text-white border-amber-400 shadow-none translate-x-[2px] translate-y-[2px]"
                        : "bg-gray-50 text-[#00183F] border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1"
                    }`}
                  >
                    <span className="font-black uppercase text-sm">{opt.label}</span>
                    <span className="text-xs mt-0.5 opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MODO DE DRAFT (todos os modos) + DIFICULDADE (só Tradicional) */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 bg-gray-100 p-4 border-2 border-dashed border-[#00183F]">
              <div className="flex-1">
                <label className="block font-black uppercase mb-1 text-sm">Modo de Draft</label>
                <select className="w-full border-4 border-[#00183F] p-2 font-bold bg-white uppercase" value={draftMode} onChange={e => setDraftMode(e.target.value)}>
                  <option value="classic">Clássico (3 Rerolls)</option>
                  <option value="hardcore">Hardcore (1 Reroll, Sem Força)</option>
                </select>
              </div>
              {mode === "tradicional" && (
                <div className="flex-1">
                  <label className="block font-black uppercase mb-1 text-sm">Dificuldade dos Bots</label>
                  <select className="w-full border-4 border-[#00183F] p-2 font-bold bg-white uppercase" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="impossible">Impossível</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="hasPassword" checked={hasPassword} onChange={(e) => setHasPassword(e.target.checked)} className="w-5 h-5" />
              <label htmlFor="hasPassword" className="font-black uppercase">Sala com Senha?</label>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isRanked"
                checked={isRanked}
                onChange={(e) => {
                  if (!user) { setShowRankedModal(true); return; }
                  setIsRanked(e.target.checked);
                }}
                className="w-5 h-5"
              />
              <label htmlFor="isRanked" className="font-black uppercase flex items-center gap-2">
                🏆 Partida Rankeada
                {!user && <span className="text-xs text-gray-400 font-bold normal-case">(login necessário)</span>}
              </label>
            </div>

            {hasPassword && (
              <div>
                <label className="block font-black uppercase mb-1 mt-2">Senha</label>
                <input type="password" className="w-full border-4 border-[#00183F] p-2 font-bold bg-gray-50" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            )}

            <button type="submit" className="w-full mt-6 bg-amber-400 text-[#00183F] py-4 font-black uppercase text-2xl border-4 border-[#00183F] shadow-[6px_6px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_#00183F] transition-all">
              Criar e Ir para o Lobby
            </button>
          </form>
        )}
      </div>

      {/* Modal: ranked room requires account */}
      {showRankedModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#D9D9D9] border-4 border-[#00183F] p-6 max-w-sm w-full text-[#00183F] shadow-[10px_10px_0_0_#0033A0] flex flex-col relative">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3 border-b-4 border-[#0033A0] pb-2">
              🏆 Partida Rankeada
            </h2>
            <p className="font-bold text-sm mb-6">
              Partidas rankeadas exigem uma conta. Faça login ou crie uma conta para continuar.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowRankedModal(false); router.push("/login"); }}
                className="w-full bg-[#0033A0] text-white border-2 border-[#00183F] py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#00183F] transition-all"
              >
                Entrar
              </button>
              <button
                onClick={() => { setShowRankedModal(false); router.push("/register"); }}
                className="w-full bg-emerald-500 text-white border-2 border-[#00183F] py-3 font-black uppercase tracking-widest shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#00183F] transition-all"
              >
                Criar Conta
              </button>
              <button
                onClick={() => setShowRankedModal(false)}
                className="text-gray-500 font-bold text-sm uppercase tracking-widest hover:text-[#00183F] transition-colors mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}