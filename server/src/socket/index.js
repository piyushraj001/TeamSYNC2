const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const presenceHandler = require("./presence.handler");
const messageHandler = require("./message.handler");
const callHandler = require("./call.handler");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware — verify JWT on every connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      socket.userEmail = payload.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // Always join a personal room for targeted messages
    socket.join(`user:${userId}`);

    // Join workspace rooms the user belongs to
    socket.on("workspace:join", ({ workspaceId }) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`👥 ${userId} joined workspace:${workspaceId}`);
    });

    // Join channel rooms
    socket.on("channel:join", ({ channelId }) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on("channel:leave", ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
    });

    // Join DM room
    socket.on("dm:join", ({ conversationId }) => {
      // Validate user is part of this conversation
      const parts = conversationId.split("_");
      if (parts.includes(userId)) {
        socket.join(`dm:${conversationId}`);
      }
    });

    // Register feature handlers
    presenceHandler(io, socket);
    messageHandler(io, socket);
    callHandler(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket disconnected: ${userId} — ${reason}`);
    });
  });

  return io;
}

module.exports = initSocket;
