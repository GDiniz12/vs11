require('dotenv').config(); // <-- CARREGA O .ENV
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Pega a URL do .env ou libera para todos (*) caso não encontre
const frontendUrl = process.env.FRONTEND_URL || "*";

app.use(cors({
  origin: frontendUrl
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendUrl, // <-- PROTEGE A CONEXÃO DO SOCKET
    methods: ["GET", "POST"]
  }
});

const rooms = {};

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
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    rooms[roomId] = {
      id: roomId,
      name: data.roomName || `Sala de ${data.nickname}`,
      host: socket.id,
      mode: data.mode,
      draftMode: data.mode === 'tradicional' ? (data.draftMode || 'classic') : 'classic',
      difficulty: data.mode === 'tradicional' ? (data.difficulty || 'medium') : 'medium',
      hasPassword: !!data.password,
      password: data.password || null,
      maxPlayers: 8,
      status: 'waiting',
      players: [{
        id: socket.id,
        nickname: data.nickname,
        isReady: false,
        draftFinished: false,
        teamData: null
      }]
    };

    socket.join(roomId);
    emitAvailableRooms();
    callback({ success: true, roomId });
  });

  socket.on('joinRoom', (data, callback) => {
    const room = rooms[data.roomId];

    if (!room) return callback({ success: false, message: 'Sala não encontrada.' });
    if (room.status !== 'waiting') return callback({ success: false, message: 'Jogo já em andamento.' });
    if (room.players.length >= room.maxPlayers) return callback({ success: false, message: 'Sala cheia.' });
    if (room.hasPassword && room.password !== data.password) return callback({ success: false, message: 'Senha incorreta.' });

    room.players.push({
      id: socket.id,
      nickname: data.nickname,
      isReady: false,
      draftFinished: false,
      teamData: null
    });

    socket.join(room.id);
    io.to(room.id).emit('roomUpdated', getSafeRoom(room));
    emitAvailableRooms();
    callback({ success: true, roomId: room.id });
  });

  socket.on('getRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ success: false, reason: 'not_found', message: 'Sala não encontrada.' });
    const isPlayerInRoom = room.players.some(p => p.id === socket.id);
    if (!isPlayerInRoom) return callback({ success: false, reason: 'not_in_room', message: 'Você não está na sala.', hasPassword: room.hasPassword });
    callback({ success: true, room: getSafeRoom(room) });
  });

  socket.on('startGame', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.host !== socket.id) return callback({ success: false, message: 'Apenas o host pode iniciar.' });
    if (room.mode === 'guerra' && room.players.length % 2 !== 0) return callback({ success: false, message: 'Modo Guerra exige número de jogadores par.' });

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
        room.players.splice(index, 1);
        socket.leave(roomId);
        if (room.players.length === 0) delete rooms[roomId];
        else {
          if (room.host === socket.id) room.host = room.players[0].id;
          io.to(roomId).emit('roomUpdated', getSafeRoom(room));
        }
        emitAvailableRooms();
      }
    }
    if(callback) callback({ success: true });
  });

  socket.on('cancelRoom', (roomId, callback) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
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

    io.to(roomId).emit('draftProgress', { finishedCount, totalPlayers });

    if (finishedCount === totalPlayers) {
      room.status = 'playing';
      const playersData = room.players.map(p => p.teamData);
      io.to(roomId).emit('hostStartSimulation', { playersData, hostId: room.host });
    }
  });

  socket.on('onlineTournamentData', (roomId, data) => {
    io.to(roomId).emit('onlineTournamentReady', data);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) delete rooms[roomId]; 
        else {
          if (room.host === socket.id) room.host = room.players[0].id;
          io.to(roomId).emit('roomUpdated', getSafeRoom(room));
        }
        emitAvailableRooms();
      }
    }
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