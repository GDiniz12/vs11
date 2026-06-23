"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const TR = {
  pt: {
    connecting: "Conectando ao servidor...",
    joinRoom: "Entrar na Sala", invited: "Você foi convidado para jogar",
    rankedRoom: "Sala Rankeada",
    rankedNeedsAccount: "Esta sala é rankeada. Faça login ou crie uma conta para entrar.",
    loginAccount: "Entrar na Conta", createAccount: "Criar Conta", backToMenu: "Voltar para o Menu",
    yourNickname: "Seu Nickname", typeHere: "Digite aqui...",
    roomPassword: "Senha da Sala", enterGame: "Entrar no Jogo",
    loadingRoom: "Carregando Sala...",
    copyLink: "Copiar Link", linkCopied: "Link copiado para a área de transferência!",
    mode: "Modo", tournament: "Torneio", draft: "Draft", difficulty: "Dif", players: "Jogadores",
    classic: "Clássico", hardcore: "Hardcore",
    diffEasy: "Fácil", diffMedium: "Médio", diffImpossible: "Impossível",
    playersInRoom: "Jogadores na Sala", host: "Host", kickTitle: "Remover jogador",
    cancel: "Cancelar", startGame: "Iniciar Jogo", leave: "Sair", waitingHost: "Aguardando Host...",
    globalChat: "Chat Global", firstMessage: "Seja o primeiro a mandar uma mensagem!",
    typeMessage: "Digite sua mensagem...", send: "Enviar",
    kickQ: "Remover jogador?", kickConfirm1: "Quer mesmo remover", kickConfirm2: "da sala?", kick: "Remover",
    cancelRoomConfirm: "Tem certeza que deseja cancelar a sala? Todos serão desconectados.",
    hostCancelled: "O host cancelou esta sala.", youWereKicked: "Você foi removido da sala pelo host.",
    needNickname: "Digite um nickname!", rankedNeedLogin: "Esta sala é rankeada. Faça login ou crie uma conta para entrar.",
    tournaments: { "super-mundial": "Super Mundial", "copa-do-mundo": "🌍 Copa do Mundo", "brasileirao": "🇧🇷 Brasileirão", "louco": "🔥 Louco" } as Record<string, string>,
  },
  en: {
    connecting: "Connecting to server...",
    joinRoom: "Join Room", invited: "You've been invited to play",
    rankedRoom: "Ranked Room",
    rankedNeedsAccount: "This room is ranked. Log in or create an account to join.",
    loginAccount: "Log In", createAccount: "Create Account", backToMenu: "Back to Menu",
    yourNickname: "Your Nickname", typeHere: "Type here...",
    roomPassword: "Room Password", enterGame: "Enter Game",
    loadingRoom: "Loading Room...",
    copyLink: "Copy Link", linkCopied: "Link copied to clipboard!",
    mode: "Mode", tournament: "Tournament", draft: "Draft", difficulty: "Diff", players: "Players",
    classic: "Classic", hardcore: "Hardcore",
    diffEasy: "Easy", diffMedium: "Medium", diffImpossible: "Impossible",
    playersInRoom: "Players in Room", host: "Host", kickTitle: "Kick player",
    cancel: "Cancel", startGame: "Start Game", leave: "Leave", waitingHost: "Waiting for Host...",
    globalChat: "Global Chat", firstMessage: "Be the first to send a message!",
    typeMessage: "Type your message...", send: "Send",
    kickQ: "Kick player?", kickConfirm1: "Really remove", kickConfirm2: "from the room?", kick: "Kick",
    cancelRoomConfirm: "Are you sure you want to cancel the room? Everyone will be disconnected.",
    hostCancelled: "The host cancelled this room.", youWereKicked: "You were removed from the room by the host.",
    needNickname: "Enter a nickname!", rankedNeedLogin: "This room is ranked. Log in or create an account to join.",
    tournaments: { "super-mundial": "Super World Cup", "copa-do-mundo": "🌍 World Cup", "brasileirao": "🇧🇷 Brasileirão", "louco": "🔥 Crazy" } as Record<string, string>,
  },
} as const;

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const { lang } = useLanguage();
  const t = TR[lang];

  const { socket, currentRoom, setCurrentRoom, nickname, setNickname, saveSession, clearSession } = useSocket();
  const { clearSave } = useGame();
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  const [messages, setMessages] = useState<{id: string, sender: string, text: string, timestamp: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Estados para o acesso via Link Direto
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomHasPassword, setRoomHasPassword] = useState(false);
  const [roomIsRanked, setRoomIsRanked] = useState(false);
  const [joinNickname, setJoinNickname] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [kickTarget, setKickTarget] = useState<{ id: string; nickname: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    const fetchRoomData = () => {
      socket.emit("getRoom", roomId, (response: any) => {
        if (response.success) {
          setCurrentRoom(response.room);
          saveSession(roomId);
          setShowJoinForm(false);
        } else {
          if (response.reason === 'not_in_room') {
            setRoomHasPassword(response.hasPassword);
            setRoomIsRanked(!!response.isRanked);
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
      clearSession();
      clearSave();
      alert(t.hostCancelled);
      router.push("/online");
    };

    const onKicked = () => {
      clearSession();
      clearSave();
      alert(t.youWereKicked);
      router.push("/online");
    };

    const onChatMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("roomUpdated", onRoomUpdated);
    socket.on("gameStarted", onGameStarted);
    socket.on("roomCancelled", onRoomCancelled);
    socket.on("chatMessage", onChatMessage);
    socket.on("kicked", onKicked);

    return () => {
      socket.off("connect", fetchRoomData);
      socket.off("roomUpdated", onRoomUpdated);
      socket.off("gameStarted", onGameStarted);
      socket.off("roomCancelled", onRoomCancelled);
      socket.off("chatMessage", onChatMessage);
      socket.off("kicked", onKicked);
    };
  }, [socket, router, roomId, setCurrentRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartGame = () => {
    setErrorMsg("");
    socket?.emit("startGame", roomId, (res: any) => {
      if (!res.success) setErrorMsg(res.message);
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket?.emit("sendChatMessage", roomId, chatInput.trim());
    setChatInput("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(t.linkCopied);
  };

  const handleLeaveRoom = () => {
    clearSession();
    clearSave();
    socket?.emit("leaveRoom", roomId, () => {
      router.push("/online");
    });
  };

  const handleKickPlayer = (player: { id: string; nickname: string }) => {
    setKickTarget(player);
  };

  const confirmKick = () => {
    if (!kickTarget) return;
    socket?.emit("kickPlayer", { roomId, targetId: kickTarget.id });
    setKickTarget(null);
  };

  const handleCancelRoom = () => {
    if (confirm(t.cancelRoomConfirm)) {
      clearSession();
      clearSave();
      socket?.emit("cancelRoom", roomId, () => {
        router.push("/online");
      });
    }
  };

  const handleJoinFromLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinNickname) return alert(t.needNickname);
    if (roomIsRanked && !user) return alert(t.rankedNeedLogin);

    socket?.emit("joinRoom", { roomId, nickname: joinNickname, rating: user?.rating ?? null, password: joinPassword }, (res: any) => {
      if (res.success) {
        clearSave();
        setNickname(joinNickname);
        saveSession(roomId);
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
        <span>{t.connecting}</span>
      </div>
    );
  }

  // TELA 2: Se o usuário acessou por um Link Direto e precisa colocar o Nickname
  if (showJoinForm) {
    const isRankedAndUnauthed = roomIsRanked && !user;
    return (
      <div className="min-h-screen bg-[#00183F] flex justify-center items-center p-6 text-[#00183F] font-sans">
        <form onSubmit={handleJoinFromLink} className="bg-[#D9D9D9] p-8 max-w-md w-full border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0]">
          <h2 className="text-3xl font-black uppercase mb-2 text-center">{t.joinRoom}</h2>
          <p className="text-center font-bold text-gray-600 mb-6 uppercase text-sm">{t.invited}</p>

          {roomIsRanked && (
            <div className="mb-4 bg-amber-100 border-2 border-amber-500 p-3 flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="font-black uppercase text-sm text-amber-800">{t.rankedRoom}</span>
            </div>
          )}

          {isRankedAndUnauthed ? (
            <div className="flex flex-col gap-3 mt-2">
              <p className="font-bold text-sm text-center text-gray-700 mb-2">
                {t.rankedNeedsAccount}
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full bg-[#0033A0] text-white py-3 font-black uppercase text-lg border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                {t.loginAccount}
              </button>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="w-full bg-emerald-500 text-white py-3 font-black uppercase text-lg border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                {t.createAccount}
              </button>
              <button type="button" onClick={() => router.push('/online')} className="w-full bg-gray-300 text-gray-700 py-2 font-black uppercase text-sm border-2 border-gray-400 hover:bg-gray-400 transition-colors mt-1">
                {t.backToMenu}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block font-black uppercase mb-1">{t.yourNickname}</label>
                <input
                  type="text"
                  className="w-full border-4 border-[#00183F] p-3 font-bold uppercase bg-white text-center text-xl"
                  value={joinNickname}
                  onChange={e => setJoinNickname(e.target.value)}
                  placeholder={t.typeHere}
                  required
                />
              </div>
              {roomHasPassword && (
                <div className="mb-6">
                  <label className="block font-black uppercase mb-1">{t.roomPassword}</label>
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
                {t.enterGame}
              </button>
              <button type="button" onClick={() => router.push('/online')} className="w-full bg-gray-300 text-gray-700 py-2 font-black uppercase text-sm border-2 border-gray-400 hover:bg-gray-400 transition-colors">
                {t.backToMenu}
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  // TELA 3: Carregamento se o servidor demorar a responder a sala
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-[#00183F] flex flex-col justify-center items-center text-white text-3xl font-black gap-4">
        <span>{t.loadingRoom}</span>
      </div>
    );
  }

  // TELA 4: O LOBBY COMPLETO
  const isHost = currentRoom.host === socket.id;

  return (
    <div className="min-h-screen bg-[#00183F] p-4 md:p-6 text-white font-sans flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6">
        
        {/* COLUNA ESQUERDA: INFOS DA SALA */}
        <div className="w-full lg:w-2/3 bg-[#D9D9D9] p-6 md:p-8 border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0] flex flex-col h-[85vh]">
          {/* Cabeçalho da Sala */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-4 border-[#00183F] pb-4 gap-4">
            <h1 className="text-3xl md:text-4xl font-black uppercase text-[#00183F] truncate max-w-full">{currentRoom.name}</h1>
            <div className="flex flex-wrap gap-2">
              <div className="bg-[#00183F] text-white px-4 py-2 text-sm font-bold uppercase flex items-center">
                ID: {currentRoom.id}
              </div>
              <button 
                onClick={handleCopyLink}
                className="bg-amber-400 text-[#00183F] px-4 py-2 text-sm font-black uppercase border-2 border-[#00183F] hover:-translate-y-1 hover:-translate-x-1 shadow-[2px_2px_0_0_#00183F] transition-transform"
              >
                {t.copyLink}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {/* Informações Globais da Sala */}
            <div className="flex flex-wrap justify-between items-center mb-8 bg-white p-4 border-2 border-[#00183F] gap-4">
              <p className="text-[#00183F] font-bold uppercase">{t.mode}: <span className="font-black text-amber-500">{currentRoom.mode}</span></p>

              <p className="text-[#00183F] font-bold uppercase text-xs md:text-base">
                {t.tournament}: <span className="font-black text-purple-700">
                  {t.tournaments[currentRoom.tournamentMode as string] ?? t.tournaments['super-mundial']}
                </span>
              </p>

              <p className="text-[#00183F] font-bold uppercase text-xs md:text-base">
                {t.draft}: <span className={`font-black ${currentRoom.draftMode === 'hardcore' ? 'text-rose-600' : 'text-emerald-600'}`}>{currentRoom.draftMode === 'hardcore' ? t.hardcore : t.classic}</span>
              </p>
              {currentRoom.mode === 'tradicional' && (
                <p className="text-[#00183F] font-bold uppercase text-xs md:text-base">
                  {t.difficulty}: <span className="font-black text-blue-600">{currentRoom.difficulty === 'impossible' ? t.diffImpossible : currentRoom.difficulty === 'easy' ? t.diffEasy : t.diffMedium}</span>
                </p>
              )}

              <p className="text-[#00183F] font-bold uppercase">{t.players}: <span className="font-black">{currentRoom.players.length}/8</span></p>
            </div>

            {/* Lista de Jogadores */}
            <h2 className="text-xl md:text-2xl font-black uppercase text-[#00183F] mb-4">{t.playersInRoom}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {currentRoom.players.map((player: any) => (
                <div key={player.id} className="bg-white border-4 border-[#00183F] p-4 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#00183F] font-black uppercase text-lg md:text-xl truncate">{player.nickname}</span>
                    {player.rating != null && (
                      <span className="text-[#0033A0] font-bold text-xs uppercase">{player.rating} pts</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {player.id === currentRoom.host && (
                      <span className="bg-amber-400 text-[#00183F] text-xs font-bold px-2 py-1 uppercase border-2 border-[#00183F]">{t.host}</span>
                    )}
                    {isHost && player.id !== currentRoom.host && (
                      <button
                        onClick={() => handleKickPlayer({ id: player.id, nickname: player.nickname })}
                        className="w-8 h-8 bg-white border-2 border-rose-600 shadow-[3px_3px_0_0_#00183F] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 flex items-center justify-center flex-shrink-0"
                        title={t.kickTitle}
                      >
                        <span className="text-rose-600 font-black text-base leading-none select-none">✕</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mensagens de Erro e Botões */}
          <div className="mt-auto pt-4 border-t-4 border-[#00183F]">
            {errorMsg && <div className="bg-rose-500 text-white p-4 font-bold uppercase text-center mb-4 border-4 border-[#00183F]">{errorMsg}</div>}
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isHost ? (
                <>
                  <button 
                    onClick={handleCancelRoom}
                    className="w-full sm:w-1/3 bg-rose-600 text-white py-3 md:py-4 font-black uppercase text-lg md:text-xl border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleStartGame}
                    className="w-full sm:w-2/3 bg-emerald-500 text-[#00183F] py-3 md:py-4 font-black uppercase text-xl md:text-2xl border-4 border-[#00183F] shadow-[6px_6px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
                  >
                    {t.startGame}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full sm:w-1/3 bg-rose-600 text-white py-3 md:py-4 font-black uppercase text-lg md:text-xl border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
                  >
                    {t.leave}
                  </button>
                  <div className="w-full sm:w-2/3 bg-gray-300 text-gray-600 py-3 md:py-4 font-black uppercase text-lg md:text-xl text-center border-4 border-gray-400 flex items-center justify-center">
                    {t.waitingHost}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CHAT (Glassmorphism + Neon Vibes) */}
        <div className="w-full lg:w-1/3 h-[50vh] lg:h-[85vh] flex flex-col bg-white/10 backdrop-blur-md border-4 border-white/20 shadow-[0_8px_32px_0_rgba(0,24,63,0.37)]">
          <div className="bg-[#00183F]/80 p-4 border-b-4 border-white/20">
            <h2 className="text-xl font-black uppercase tracking-widest text-white text-center">{t.globalChat}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/50 font-bold uppercase text-sm text-center">
                {t.firstMessage}
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender === nickname;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-black uppercase text-white/70 mb-1">{msg.sender}</span>
                    <div className={`px-4 py-2 max-w-[85%] break-words font-medium text-sm border-2 ${
                      isMe 
                        ? 'bg-sky-500/80 border-sky-300 text-white rounded-l-xl rounded-tr-xl' 
                        : 'bg-white/20 border-white/40 text-white rounded-r-xl rounded-tl-xl'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-4 bg-[#00183F]/60 border-t-4 border-white/20 flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder={t.typeMessage}
              className="flex-1 bg-white/10 border-2 border-white/30 text-white placeholder-white/50 px-3 py-2 font-bold focus:outline-none focus:border-sky-400 focus:bg-white/20 transition-all"
              maxLength={100}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-sky-500 text-white px-4 py-2 font-black uppercase border-2 border-sky-300 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.send}
            </button>
          </form>
        </div>

      </div>

      {/* Modal de confirmação de kick */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00183F]/70 backdrop-blur-sm p-4">
          <div className="bg-[#D9D9D9] border-4 border-[#00183F] shadow-[10px_10px_0_0_#0033A0] max-w-sm w-full p-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] flex items-center justify-center">
              <span className="text-white font-black text-3xl leading-none select-none">✕</span>
            </div>
            <div className="text-center">
              <p className="text-[#00183F] font-black uppercase text-xl mb-1">{t.kickQ}</p>
              <p className="text-[#00183F] font-bold text-base">
                {t.kickConfirm1}{" "}
                <span className="text-rose-600 uppercase">{kickTarget.nickname}</span>{" "}
                {t.kickConfirm2}
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setKickTarget(null)}
                className="flex-1 bg-white text-[#00183F] py-3 font-black uppercase border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmKick}
                className="flex-1 bg-rose-600 text-white py-3 font-black uppercase border-4 border-[#00183F] shadow-[4px_4px_0_0_#00183F] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
              >
                {t.kick}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}