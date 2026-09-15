// In-memory presence store: userId -> Set of socketIds
const onlineUsers = new Map();
// Offline grace period timers: userId -> timeoutId
const offlineTimers = new Map();

const OFFLINE_GRACE_MS = 30 * 1000; // 30 seconds

function presenceHandler(io, socket) {
  const { userId } = socket;

  // Add this socket to the user's active connections
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Cancel any pending offline timer (user reconnected)
  if (offlineTimers.has(userId)) {
    clearTimeout(offlineTimers.get(userId));
    offlineTimers.delete(userId);
  }

  // Broadcast online status to workspaces the user just joined
  socket.on("workspace:joined", ({ workspaceId }) => {
    // Emit this user's status to the workspace
    socket.to(`workspace:${workspaceId}`).emit("presence:update", {
      userId,
      status: "online",
    });

    // Emit bulk presence of all online workspace members to this socket
    // We approximate by emitting all currently online users
    const onlineList = [];
    for (const [uid] of onlineUsers) {
      if (onlineUsers.get(uid).size > 0) {
        onlineList.push({ userId: uid, status: "online" });
      }
    }
    socket.emit("presence:bulk", { users: onlineList });
  });

  // Away status tracking
  socket.on("presence:activity", () => {
    socket.data.lastActivity = Date.now();
    // If they were away, mark them back online
    if (socket.data.status === "away") {
      socket.data.status = "online";
      broadcastPresence(io, socket, userId, "online");
    }
  });

  // Handle disconnect with grace period
  socket.on("disconnect", () => {
    const connections = onlineUsers.get(userId);
    if (connections) {
      connections.delete(socket.id);
    }

    // If user has other active connections, stay online
    if (connections && connections.size > 0) return;

    // Start grace period before marking offline
    const timer = setTimeout(() => {
      onlineUsers.delete(userId);
      offlineTimers.delete(userId);
      broadcastPresence(io, socket, userId, "offline");
    }, OFFLINE_GRACE_MS);

    offlineTimers.set(userId, timer);
  });
}

function broadcastPresence(io, socket, userId, status) {
  // Broadcast to all rooms this socket was in
  for (const room of socket.rooms) {
    if (room.startsWith("workspace:")) {
      io.to(room).emit("presence:update", { userId, status });
    }
  }
}

// Expose online check for other modules
presenceHandler.isOnline = (userId) => {
  const connections = onlineUsers.get(userId);
  return connections && connections.size > 0;
};

presenceHandler.getOnlineUsers = () => {
  const result = [];
  for (const [userId, connections] of onlineUsers) {
    if (connections.size > 0) result.push(userId);
  }
  return result;
};

module.exports = presenceHandler;
