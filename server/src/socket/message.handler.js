const { prisma } = require("../lib/prisma");

// typing state: channelId -> Map<userId, { displayName, timer }>
const typingState = new Map();
const TYPING_TIMEOUT_MS = 3000;

function messageHandler(io, socket) {
  const { userId } = socket;

  // ── CHANNEL MESSAGE ──────────────────────────────────────────────────────────
  socket.on("message:send", async ({ channelId, content, tempId }) => {
    if (!content?.trim() || !channelId) return;
    if (content.length > 4000) {
      socket.emit("message:error", { tempId, error: "Message too long (max 4000 chars)" });
      return;
    }

    try {
      // Verify membership
      const member = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (!member) {
        socket.emit("message:error", { tempId, error: "Not a channel member" });
        return;
      }

      const message = await prisma.message.create({
        data: { content: content.trim(), channelId, senderId: userId },
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      // Broadcast to everyone in channel (including sender for confirmation)
      io.to(`channel:${channelId}`).emit("message:new", { message, tempId });

      // Clear typing indicator for sender
      clearTyping(io, userId, channelId);
    } catch (err) {
      console.error("message:send error:", err);
      socket.emit("message:error", { tempId, error: "Failed to send message" });
    }
  });

  // ── DIRECT MESSAGE ────────────────────────────────────────────────────────────
  socket.on("dm:send", async ({ recipientId, content, tempId }) => {
    if (!content?.trim() || !recipientId) return;

    try {
      const conversationId = [userId, recipientId].sort().join("_");

      const dm = await prisma.directMessage.create({
        data: {
          content: content.trim(),
          senderId: userId,
          receiverId: recipientId,
          conversationId,
        },
        include: {
          sender: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      // Emit to both users' DM room and personal rooms
      io.to(`dm:${conversationId}`).emit("dm:new", { message: dm, tempId });
      // Also push to recipient's personal room in case they haven't joined the DM room
      io.to(`user:${recipientId}`).emit("dm:new", { message: dm, tempId });
    } catch (err) {
      console.error("dm:send error:", err);
      socket.emit("message:error", { tempId, error: "Failed to send DM" });
    }
  });

  // ── TYPING INDICATORS ─────────────────────────────────────────────────────────
  socket.on("typing:start", async ({ channelId }) => {
    if (!channelId) return;

    try {
      // Get user info for display
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });

      if (!typingState.has(channelId)) typingState.set(channelId, new Map());
      const channelTyping = typingState.get(channelId);

      // Clear existing timer
      if (channelTyping.has(userId)) {
        clearTimeout(channelTyping.get(userId).timer);
      }

      // Set auto-clear timer
      const timer = setTimeout(() => {
        clearTyping(io, userId, channelId);
      }, TYPING_TIMEOUT_MS);

      channelTyping.set(userId, { displayName: user?.displayName || "Someone", timer });

      emitTypingUpdate(io, channelId);
    } catch (err) {
      // non-critical, ignore
    }
  });

  socket.on("typing:stop", ({ channelId }) => {
    if (channelId) clearTyping(io, userId, channelId);
  });

  // DM typing
  socket.on("dm:typing:start", ({ conversationId }) => {
    io.to(`dm:${conversationId}`).emit("dm:typing:update", { userId, typing: true });
    setTimeout(() => {
      io.to(`dm:${conversationId}`).emit("dm:typing:update", { userId, typing: false });
    }, TYPING_TIMEOUT_MS);
  });

  socket.on("dm:typing:stop", ({ conversationId }) => {
    io.to(`dm:${conversationId}`).emit("dm:typing:update", { userId, typing: false });
  });

  // Clean up typing on disconnect
  socket.on("disconnect", () => {
    for (const [channelId] of typingState) {
      clearTyping(io, userId, channelId);
    }
  });
}

function clearTyping(io, userId, channelId) {
  if (!typingState.has(channelId)) return;
  const channelTyping = typingState.get(channelId);
  if (channelTyping.has(userId)) {
    const entry = channelTyping.get(userId);
    clearTimeout(entry.timer);
    channelTyping.delete(userId);
  }
  if (channelTyping.size === 0) typingState.delete(channelId);
  emitTypingUpdate(io, channelId);
}

function emitTypingUpdate(io, channelId) {
  const channelTyping = typingState.get(channelId);
  const users = channelTyping
    ? Array.from(channelTyping.entries()).map(([uid, data]) => ({
        userId: uid,
        displayName: data.displayName,
      }))
    : [];
  io.to(`channel:${channelId}`).emit("typing:update", { channelId, users });
}

module.exports = messageHandler;
