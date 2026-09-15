const { prisma } = require("../lib/prisma");

// Build a stable conversationId from two user IDs (sorted)
function buildConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}

// GET /api/dms/:recipientId  — get/create conversation + recent messages
exports.getOrCreateDMConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const userId = req.user.userId;

    if (userId === recipientId) {
      return res.status(400).json({ error: "Cannot DM yourself" });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, displayName: true, avatarUrl: true, email: true },
    });
    if (!recipient) return res.status(404).json({ error: "User not found" });

    const conversationId = buildConversationId(userId, recipientId);

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    messages.reverse();

    res.json({ conversationId, recipient, messages, hasMore: messages.length === 50 });
  } catch (err) {
    next(err);
  }
};

// GET /api/dms/:conversationId/messages  — paginated DM history
exports.getDMMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { before, limit } = req.query;
    const userId = req.user.userId;

    // Security: only members of this convo (userId appears in sorted pair)
    const parts = conversationId.split("_");
    if (!parts.includes(userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const take = Math.min(parseInt(limit) || 50, 100);

    const messages = await prisma.directMessage.findMany({
      where: {
        conversationId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    messages.reverse();

    res.json({ messages, hasMore: messages.length === take });
  } catch (err) {
    next(err);
  }
};

// GET /api/dms  — list all DM conversations for the current user
exports.getDMConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get all distinct conversations involving this user
    const dms = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      distinct: ["conversationId"],
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    // Shape into conversation objects
    const conversations = dms.map((dm) => {
      const other = dm.senderId === userId ? dm.receiver : dm.sender;
      return {
        conversationId: dm.conversationId,
        recipient: other,
        lastMessage: dm.content,
        lastMessageAt: dm.createdAt,
      };
    });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};
