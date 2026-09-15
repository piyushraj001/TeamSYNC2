const { prisma } = require("../lib/prisma");

const MESSAGE_LIMIT = 50;

// GET /api/channels/:channelId/messages
exports.getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { before, limit } = req.query;
    const userId = req.user.userId;

    // Verify member access
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const isMember = await prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
    });
    if (!isMember) {
      const wsm = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
      });
      if (!wsm || channel.isPrivate) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const take = Math.min(parseInt(limit) || MESSAGE_LIMIT, 100);

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    // Return oldest-first
    messages.reverse();

    const hasMore = messages.length === take;

    res.json({ messages, hasMore });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/messages/:messageId
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content?.trim()) return res.status(400).json({ error: "Content required" });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId !== userId) return res.status(403).json({ error: "Cannot edit others' messages" });

    // 5-minute edit window
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > fiveMinutes) {
      return res.status(400).json({ error: "Edit window expired (5 minutes)" });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim(), isEdited: true, editedAt: new Date() },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    // Broadcast edit
    const io = req.app.get("io");
    if (io) {
      io.to(`channel:${message.channelId}`).emit("message:updated", { message: updated });
    }

    res.json({ message: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/messages/:messageId
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check ownership or admin
    if (message.senderId !== userId) {
      const channel = await prisma.channel.findUnique({ where: { id: message.channelId } });
      const wsm = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
      });
      if (!wsm || wsm.role !== "ADMIN") {
        return res.status(403).json({ error: "Cannot delete others' messages" });
      }
    }

    await prisma.message.delete({ where: { id: messageId } });

    const io = req.app.get("io");
    if (io) {
      io.to(`channel:${message.channelId}`).emit("message:deleted", {
        messageId,
        channelId: message.channelId,
      });
    }

    res.json({ message: "Message deleted" });
  } catch (err) {
    next(err);
  }
};
