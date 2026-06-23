require('dotenv').config(); // <-- CARREGA O .ENV
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/auth');

// Fail fast if critical secrets are missing — a missing JWT_SECRET would
// otherwise produce 500s at request time or, worse, forgeable tokens.
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`FATAL: variáveis de ambiente ausentes: ${missingEnv.join(', ')}. Verifique o arquivo .env.`);
  process.exit(1);
}

const app = express();

// Pega a URL do .env ou libera para todos (*) caso não encontre
const frontendUrl = process.env.FRONTEND_URL || "*";

app.use(cors({
  origin: frontendUrl
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendUrl, // <-- PROTEGE A CONEXÃO DO SOCKET
    methods: ["GET", "POST"]
  }
});

const rooms = {};
const disconnectTimers = {}; // Timers de desconexão pendentes para reconexão mobile

// The lobby rating is supplied by the client and is display-only. Sanitize it
// so a forged payload can't inject a non-numeric / absurd value into the room
// broadcast. (SEC3 — full authoritative rating requires socket auth / SEC6.)
function sanitizeRating(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100000, Math.round(value)));
}

io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  const emitAvailableRooms = () => {
    const availableRooms = Object.values(rooms).filter(r => r.status === 'waiting');
    const safeRooms = availableRooms.map(({ password, ...rest }) => rest);
    io.emit('roomsList', safeRooms);
  };

  socket.on('requestRooms', () => {
    const availableRooms = Object.values(rooms).filter(r => r.status === 'waiting');
    const safeRooms = availableRooms.map(({ password, ...rest }) => rest);
    socket.emit('roomsList', safeRooms);
  });

  emitAvailableRooms();

  socket.on('createRoom', (data, callback) => {
    const isAlreadyInRoom = Object.values(rooms).some(r => r.players.some(p => p.id === socket.id));
    if (isAlreadyInRoom) return callback({ success: false, message: 'Você já está em uma sala.' });

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanNickname = data.nickname.trim();
    
    rooms[roomId] = {
      id: roomId,
      name: data.roomName || `Sala de ${cleanNickname}`,
      host: socket.id,
      hostNickname: cleanNickname,
      mode: data.mode,
      tournamentMode: data.tournamentMode || 'super-mundial',
      draftMode: data.draftMode || 'classic',
      difficulty: data.mode === 'tradicional' ? (data.difficulty || 'medium') : 'medium',
      isRanked: !!data.isRanked,
      hasPassword: !!data.password,
      password: data.password || null,
      maxPlayers: 8,
      status: 'waiting',
      players: [{
        id: socket.id,
        nickname: cleanNickname,
        rating: sanitizeRating(data.rating),
        isReady: false,
        draftFinished: false,
        teamData: null
      }]
    };

    // Salva dados no socket para reconexão mobile
    socket._nickname = data.nickname;
    socket._roomId = roomId;

    socket.join(roomId);
    emitAvailableRooms();
    callback({ success: true, roomId });
  });

  socket.on('joinRoom', (data, callback) => {
    const isAlreadyInRoom = Object.values(rooms).some(r => r.players.some(p => p.id === socket.id));
    if (isAlreadyInRoom) return callback({ success: false, message: 'Você já está em uma sala.' });

    const room = rooms[data.roomId];

    if (!room) return callback({ success: false, message: 'Sala não encontrada.' });
    if (room.status !== 'waiting') return callback({ success: false, message: 'Jogo já em andamento.' });
    if (room.players.length >= room.maxPlayers) return callback({ success: false, message: 'Sala cheia.' });
    if (room.hasPassword && room.password !== data.password) return callback({ success: false, message: 'Senha incorreta.' });
    
    const cleanNickname = data.nickname.trim();
    if (room.players.some(p => p.nickname.toLowerCase() === cleanNickname.toLowerCase())) return callback({ success: false, message: 'Este nickname já está em uso nesta sala.' });

    room.players.push({
      id: socket.id,
      nickname: cleanNickname,
      rating: sanitizeRating(data.rating),
      isReady: false,
      draftFinished: false,
      teamData: null
    });

    // Salva dados no socket para reconexão mobile
    socket._nickname = data.nickname;
    socket._roomId = data.roomId;

    socket.join(room.id);
    io.to(room.id).emit('roomUpdated', getSafeRoom(room));
    emitAvailableRooms();
    callback({ success: true, roomId: room.id });
  });

  // Reconexão mobile — jogador que trocou de aba/app e voltou
  socket.on('rejoinRoom', ({ nickname, roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, message: 'Sala não encontrada.' });

    const player = room.players.find(p => p.nickname === nickname);
    if (!player) return callback({ success: false, message: 'Jogador não encontrado na sala.' });

    // Cancela o timer de desconexão pendente, se existir
    const timerKey = `${nickname}::${roomId}`;
    if (disconnectTimers[timerKey]) {
      clearTimeout(disconnectTimers[timerKey]);
      delete disconnectTimers[timerKey];
      console.log(`Reconexão: timer cancelado para ${nickname} na sala ${roomId}`);
    }

    const oldId = player.id;

    // Atualiza o id do jogador para o novo socket
    player.id = socket.id;
    socket.join(roomId);

    // Se o jogador antigo era o host, atualiza o host
    if (room.host === oldId) {
      room.host = socket.id;
      room.hostNickname = nickname;
    }

    // Salva dados no socket para futuras reconexões
    socket._nickname = nickname;
    socket._roomId = roomId;

    io.to(roomId).emit('roomUpdated', getSafeRoom(room));
    console.log(`Jogador ${nickname} reconectou na sala ${roomId} (${oldId} -> ${socket.id})`);
    callback({ success: true, room: getSafeRoom(room) });
  });

  socket.on('getRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, reason: 'not_found', message: 'Sala não encontrada.' });
    const isPlayerInRoom = room.players.some(p => p.id === socket.id);
    if (!isPlayerInRoom) return callback({ success: false, reason: 'not_in_room', message: 'Você não está na sala.', hasPassword: room.hasPassword, isRanked: room.isRanked });
    callback({ success: true, room: getSafeRoom(room) });
  });

  socket.on('startGame', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.host !== socket.id) return callback({ success: false, message: 'Apenas o host pode iniciar.' });
    if (room.mode === 'guerra' && room.players.length < 2) return callback({ success: false, message: 'Modo Guerra exige pelo menos 2 jogadores.' });

    room.status = 'drafting';
    io.to(roomId).emit('gameStarted');
    emitAvailableRooms();
    callback({ success: true });
  });

  socket.on('leaveRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (room) {
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        // Limpa timer de desconexão pendente, se existir
        const nickname = room.players[index].nickname;
        const timerKey = `${nickname}::${roomId}`;
        if (disconnectTimers[timerKey]) {
          clearTimeout(disconnectTimers[timerKey]);
          delete disconnectTimers[timerKey];
        }

        room.players.splice(index, 1);
        socket.leave(roomId);

        // Limpa dados de reconexão do socket
        socket._nickname = null;
        socket._roomId = null;

        if (room.players.length === 0) delete rooms[roomId];
        else {
          if (room.host === socket.id) {
            room.host = room.players[0].id;
            room.hostNickname = room.players[0].nickname;
          }
          io.to(roomId).emit('roomUpdated', getSafeRoom(room));
        }
        emitAvailableRooms();
      }
    }
    if(callback) callback({ success: true });
  });

  socket.on('kickPlayer', ({ roomId, targetId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false, message: 'Sala não encontrada.' });
    if (room.host !== socket.id) return callback?.({ success: false, message: 'Apenas o host pode remover jogadores.' });

    const idx = room.players.findIndex(p => p.id === targetId);
    if (idx === -1) return callback?.({ success: false, message: 'Jogador não encontrado.' });

    const kicked = room.players[idx];

    const timerKey = `${kicked.nickname}::${roomId}`;
    if (disconnectTimers[timerKey]) {
      clearTimeout(disconnectTimers[timerKey]);
      delete disconnectTimers[timerKey];
    }

    room.players.splice(idx, 1);

    io.to(targetId).emit('kicked');
    io.to(roomId).emit('roomUpdated', getSafeRoom(room));
    emitAvailableRooms();
    callback?.({ success: true });
  });

  socket.on('cancelRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      // Limpa todos os timers de desconexão dos jogadores desta sala
      for (const player of room.players) {
        const timerKey = `${player.nickname}::${roomId}`;
        if (disconnectTimers[timerKey]) {
          clearTimeout(disconnectTimers[timerKey]);
          delete disconnectTimers[timerKey];
        }
      }

      io.to(roomId).emit('roomCancelled');
      delete rooms[roomId];
      emitAvailableRooms();
      if(callback) callback({ success: true });
    }
  });

  socket.on('playerDraftComplete', (roomId, teamData) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.draftFinished = true;
      player.teamData = teamData;
    }

    const finishedCount = room.players.filter(p => p.draftFinished).length;
    const totalPlayers = room.players.length;
    const playersStatus = room.players.map(p => ({
      nickname: p.nickname,
      draftFinished: p.draftFinished
    }));

    io.to(roomId).emit('draftProgress', { finishedCount, totalPlayers, playersStatus });

    if (finishedCount === totalPlayers) {
      room.status = 'playing';
      const playersData = room.players.map(p => p.teamData);
      io.to(roomId).emit('allDraftsComplete', { playersData, hostId: room.host, hostNickname: room.hostNickname });
    }
  });

  socket.on('sendChatMessage', (roomId, text) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const player = room.players.find(p => p.id === socket.id);
    const senderName = player ? player.nickname : (socket._nickname || "Anônimo");

    const messageObj = {
      id: Date.now() + Math.random().toString(),
      sender: senderName,
      text: text,
      timestamp: new Date().toISOString()
    };

    io.to(roomId).emit('chatMessage', messageObj);
  });

  socket.on('onlineTournamentData', (roomId, data) => {
    io.to(roomId).emit('onlineTournamentReady', data);
  });

  socket.on('disconnect', () => {
    const nickname = socket._nickname;
    const roomId = socket._roomId;

    // Se o socket não tinha sala/nickname, nada a fazer
    if (!nickname || !roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    // Inicia um timer de 15 segundos antes de remover o jogador (reconexão mobile)
    const timerKey = `${nickname}::${roomId}`;
    console.log(`Desconexão detectada: ${nickname} na sala ${roomId}. Aguardando 15s para reconexão...`);

    disconnectTimers[timerKey] = setTimeout(() => {
      delete disconnectTimers[timerKey];

      // Verifica se a sala ainda existe
      const currentRoom = rooms[roomId];
      if (!currentRoom) return;

      // Verifica se o jogador ainda está na sala (pode ter reconectado com outro nickname)
      const idx = currentRoom.players.findIndex(p => p.nickname === nickname);
      if (idx === -1) return;

      // Remove o jogador após o timeout
      currentRoom.players.splice(idx, 1);
      console.log(`Jogador ${nickname} removido da sala ${roomId} após timeout de reconexão.`);

      if (currentRoom.players.length === 0) {
        delete rooms[roomId];
      } else {
        if (currentRoom.host === socket.id) {
          currentRoom.host = currentRoom.players[0].id;
          currentRoom.hostNickname = currentRoom.players[0].nickname;
        }
        io.to(roomId).emit('roomUpdated', getSafeRoom(currentRoom));
      }
      emitAvailableRooms();
    }, 15000);
  });
});

function getSafeRoom(room) {
  const { password, ...safeRoom } = room;
  return safeRoom;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor de Sockets rodando na porta ${PORT}`);
});