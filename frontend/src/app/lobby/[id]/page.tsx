"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  
  const { socket, currentRoom, setCurrentRoom, nickname, setNickname } = useSocket();
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estados para o acesso via Link Direto
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [joinNickname, setJoinNickname] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  useEffect(() => {
    if (!socket) return;

    const fetchRoomData = () => {
      socket.emit("getRoom", roomId, (response: any) => {
        if (response.success) {
          setCurrentRoom(response.room);
          setShowJoinForm(false);
        } else {
          if (response.reason === 'not_in_room') {
            setRoomHasPassword(response.hasPassword);
            setShowJoinForm(true);
          } else {
            alert(response.message);
            router.push("/online");
          }
        }
      });
    };

    // Trava de segurança: Só pergunta da sala se já estiver 100% conectado
    if (socket.connected) {
      fetchRoomData();
    } else {
      socket.on("connect", fetchRoomData);
    }

    const onRoomUpdated = (roomData: any) => setCurrentRoom(roomData);
    const onGameStarted = () => router.push(`/formation?onlineRoom=${roomId}`);
    const onRoomCancelled = () => {
      alert("O host cancelou esta sala.");
      router.push("/online");
    };

    socket.on("roomUpdated", onRoomUpdated);
    socket.on("gameStarted", onGameStarted);
    socket.on("roomCancelled", onRoomCancelled);

    return () => {
      socket.off("connect", fetchRoomData);
      socket.off("roomUpdated", onRoomUpdated);
      socket.off("gameStarted", onGameStarted);
      socket.off("roomCancelled", onRoomCancelled);
    };
  }, [socket, router, roomId, setCurrentRoom]);

  const handleStartGame = () => {
    setErrorMsg("");
    socket?.emit("startGame", roomId, (res: any) => {
      if (!res.success) setErrorMsg(res.message);
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copiado para a área de transferência!");
  };

  const handleLeaveRoom = () => {
    socket?.emit("leaveRoom", roomId, () => {
      router.push("/online");
    });
  };

  const handleCancelRoom = () => {
    if (confirm("Tem certeza que deseja cancelar a sala? Todos serão desconectados.")) {
      socket?.emit("cancelRoom", roomId, () => {
        router.push("/online");
      });
    }
  };

  const handleJoinFromLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinNickname) return alert("Digite um nickname!");

    socket?.emit("joinRoom", { roomId, nickname: joinNickname, password: joinPassword }, (res: any) => {
      if (res.success) {
        setNickname(joinNickname);
        setShowJoinForm(false);
        // Atualiza os dados da sala logo após entrar
        socket.emit("getRoom", roomId, (resp: any) => {
          if (resp.success) setCurrentRoom(resp.room);
        });
      } else {
        alert(res.message);
      }
    });
  };

  // TELA 1: Se o Socket não conectou ainda
  if (!socket) {
    return (
      <div className="min-h-screen bg-[#00183F] flex flex-col justify-center items-center text-white text-3xl font-black gap-4">
        <span>Conectando ao servidor...</span>
      </div>
    );
  }

  // TELA 2: Se o usuário acessou por um Link Direto e precisa colocar o Nickname
  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-[#00183F] flex justify-center items-center p-6 text-[#00183F] font-sans">
        <form onSubmit={handleJoinFromLink} className="bg-[#D9D9D9] p-8 max-w-md w-full border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0]">
          <h2 className="text-3xl font-black uppercase mb-2 text-center">Entrar na Sala</h2>
          <p className="text-center font-bold text-gray-600 mb-6 uppercase text-sm">Você foi convidado para jogar</p>
          
          <div className="mb-4">
            <label className="block font-black uppercase mb-1">Seu Nickname</label>
            <input 
              type="text" 
              className="w-full border-4 border-[#00183F] p-3 font-bold uppercase bg-white text-center text-xl" 
              value={joinNickname} 
              onChange={e => setJoinNickname(e.target.value)} 
              placeholder="Digite aqui..."
              required 
            />
          </div>
          {roomHasPassword && (
            <div className="mb-6">
              <label className="block font-black uppercase mb-1">Senha da Sala</label>
              <input 
                type="password" 
                className="w-full border-4 border-[#00183F] p-3 font-bold bg-white text-center text-xl" 
                value={joinPassword} 
                onChange={e => setJoinPassword(e.target.value)} 
                required 
              />
            </div>
          )}
          <button type="submit" className="w-full bg-emerald-500 text-[#00183F] py-4 font-black uppercase text-2xl border-4 border-[#00183F] shadow-[6px_6px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform mb-4">
            Entrar no Jogo
          </button>
          <button type="button" onClick={() => router.push('/online')} className="w-full bg-gray-300 text-gray-700 py-2 font-black uppercase text-sm border-2 border-gray-400 hover:bg-gray-400 transition-colors">
            Voltar para o Menu
          </button>
        </form>
      </div>
    );
  }

  // TELA 3: Carregamento se o servidor demorar a responder a sala
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-[#00183F] flex flex-col justify-center items-center text-white text-3xl font-black gap-4">
        <span>Carregando Sala...</span>
      </div>
    );
  }

  // TELA 4: O LOBBY COMPLETO
  const isHost = currentRoom.host === socket.id;

  return (
    <div className="min-h-screen bg-[#00183F] p-6 text-white font-sans flex flex-col items-center">
      <div className="w-full max-w-4xl bg-[#D9D9D9] p-8 border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0]">
        
        {/* Cabeçalho da Sala */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-4 border-[#00183F] pb-4 gap-4">
          <h1 className="text-4xl font-black uppercase text-[#00183F]">{currentRoom.name}</h1>
          <div className="flex flex-wrap gap-2">
            <div className="bg-[#00183F] text-white px-4 py-2 text-sm font-bold uppercase flex items-center">
              ID: {currentRoom.id}
            </div>
            <button 
              onClick={handleCopyLink}
              className="bg-amber-400 text-[#00183F] px-4 py-2 text-sm font-black uppercase border-2 border-[#00183F] hover:-translate-y-1 hover:-translate-x-1 shadow-[2px_2px_0_0_#00183F] transition-transform"
            >
              Copiar Link
            </button>
          </div>
        </div>

        {/* Informações Globais da Sala (Dinâmico para Tradicional x Guerra) */}
        <div className="flex flex-wrap justify-between items-center mb-8 bg-white p-4 border-2 border-[#00183F] gap-4">
          <p className="text-[#00183F] font-bold uppercase">Modo: <span className="font-black text-amber-500">{currentRoom.mode}</span></p>
          
          {currentRoom.mode === 'tradicional' && (
            <>
              <p className="text-[#00183F] font-bold uppercase text-xs md:text-base">
                Draft: <span className="font-black text-rose-600">{currentRoom.draftMode === 'hardcore' ? 'Hardcore' : 'Clássico'}</span>
              </p>
              <p className="text-[#00183F] font-bold uppercase text-xs md:text-base">
                Dif: <span className="font-black text-blue-600">{currentRoom.difficulty === 'impossible' ? 'Impossível' : currentRoom.difficulty === 'easy' ? 'Fácil' : 'Médio'}</span>
              </p>
            </>
          )}

          <p className="text-[#00183F] font-bold uppercase">Jogadores: <span className="font-black">{currentRoom.players.length}/8</span></p>
        </div>

        {/* Lista de Jogadores */}
        <h2 className="text-2xl font-black uppercase text-[#00183F] mb-4">Jogadores na Sala</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {currentRoom.players.map((player: any) => (
            <div key={player.id} className="bg-white border-4 border-[#00183F] p-4 flex items-center justify-between">
              <span className="text-[#00183F] font-black uppercase text-xl">{player.nickname}</span>
              {player.id === currentRoom.host && <span className="bg-amber-400 text-[#00183F] text-xs font-bold px-2 py-1 uppercase border-2 border-[#00183F]">Host</span>}
            </div>
          ))}
        </div>

        {/* Mensagens de Erro */}
        {errorMsg && <div className="bg-rose-500 text-white p-4 font-bold uppercase text-center mb-6 border-4 border-[#00183F]">{errorMsg}</div>}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {isHost ? (
            <>
              <button 
                onClick={handleCancelRoom}
                className="w-full sm:w-1/3 bg-rose-600 text-white py-4 font-black uppercase text-xl border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                Cancelar Sala
              </button>
              <button 
                onClick={handleStartGame}
                className="w-full sm:w-2/3 bg-emerald-500 text-[#00183F] py-4 font-black uppercase text-2xl border-4 border-[#00183F] shadow-[6px_6px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                Iniciar Jogo
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleLeaveRoom}
                className="w-full sm:w-1/3 bg-rose-600 text-white py-4 font-black uppercase text-xl border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                Sair da Sala
              </button>
              <div className="w-full sm:w-2/3 bg-gray-300 text-gray-600 py-4 font-black uppercase text-xl text-center border-4 border-gray-400 flex items-center justify-center">
                Aguardando Host...
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}