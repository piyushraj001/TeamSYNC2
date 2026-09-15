const { prisma } = require("../lib/prisma");

// Helper: verify user is workspace member
async function requireWorkspaceMember(userId, workspaceId) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member) throw Object.assign(new Error("Not a workspace member"), { status: 403 });
  return member;
}

// Helper: verify user is channel member
async function requireChannelMember(userId, channelId) {
  const member = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId, channelId } },
  });
  if (!member) throw Object.assign(new Error("Not a channel member"), { status: 403 });
  return member;
}

// POST /api/workspaces/:workspaceId/channels
exports.createChannel = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, isPrivate, memberIds } = req.body;
    const userId = req.user.userId;

    await requireWorkspaceMember(userId, workspaceId);

    if (!name || name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: "Channel name must be 2-50 characters" });
    }

    // Sanitize: lowercase, hyphens only
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.channel.create({
        data: {
          name: sanitizedName,
          description: description?.trim(),
          isPrivate: Boolean(isPrivate),
          workspaceId,
          createdById: userId,
        },
      });

      // Auto-add creator
      await tx.channelMember.create({ data: { userId, channelId: ch.id } });

      // Add extra members for private channels
      if (isPrivate && memberIds?.length) {
        const extras = memberIds.filter((id) => id !== userId);
        if (extras.length) {
          await tx.channelMember.createMany({
            data: extras.map((id) => ({ userId: id, channelId: ch.id })),
            skipDuplicates: true,
          });
        }
      }

      return ch;
    });

    // Emit new channel to workspace via Socket.IO
    const io = req.app.get("io");
    if (io) {
      const fullChannel = await prisma.channel.findUnique({
        where: { id: channel.id },
        include: { _count: { select: { members: true } } },
      });
      if (!isPrivate) {
        io.to(`workspace:${workspaceId}`).emit("channel:new", { channel: fullChannel });
      } else {
        // Only emit to channel members
        const members = await prisma.channelMember.findMany({ where: { channelId: channel.id } });
        members.forEach((m) => {
          io.to(`user:${m.userId}`).emit("channel:new", { channel: fullChannel });
        });
      }
    }

    res.status(201).json({ channel });
  } catch (err) {
    next(err);
  }
};

// GET /api/workspaces/:workspaceId/channels
exports.getChannels = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    await requireWorkspaceMember(userId, workspaceId);

    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          { isPrivate: true, members: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ channels });
  } catch (err) {
    next(err);
  }
};

// GET /api/channels/:channelId
exports.getChannelDetails = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { _count: { select: { members: true } } },
    });

    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Check access
    if (channel.isPrivate) {
      await requireChannelMember(userId, channelId);
    } else {
      await requireWorkspaceMember(userId, channel.workspaceId);
    }

    res.json({ channel });
  } catch (err) {
    next(err);
  }
};

// POST /api/channels/:channelId/join
exports.joinChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    if (channel.isPrivate) return res.status(403).json({ error: "Cannot join private channel without invite" });

    await requireWorkspaceMember(userId, channel.workspaceId);

    await prisma.channelMember.upsert({
      where: { userId_channelId: { userId, channelId } },
      create: { userId, channelId },
      update: {},
    });

    res.json({ message: "Joined channel successfully" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/channels/:channelId/members/me
exports.leaveChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    if (channel.name === "general") return res.status(400).json({ error: "Cannot leave #general channel" });

    await prisma.channelMember.deleteMany({ where: { userId, channelId } });

    res.json({ message: "Left channel successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/channels/:channelId/members
exports.inviteToChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userIds } = req.body;
    const userId = req.user.userId;

    await requireChannelMember(userId, channelId);

    if (!userIds?.length) return res.status(400).json({ error: "userIds required" });

    await prisma.channelMember.createMany({
      data: userIds.map((id) => ({ userId: id, channelId })),
      skipDuplicates: true,
    });

    // Notify new members
    const io = req.app.get("io");
    if (io) {
      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      userIds.forEach((id) => {
        io.to(`user:${id}`).emit("channel:new", { channel });
      });
    }

    res.json({ message: "Members invited successfully" });
  } catch (err) {
    next(err);
  }
};

// GET /api/channels/:channelId/members
exports.getChannelMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    if (channel.isPrivate) {
      await requireChannelMember(userId, channelId);
    } else {
      await requireWorkspaceMember(userId, channel.workspaceId);
    }

    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
      },
    });

    res.json({ members, total: members.length });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/channels/:channelId
exports.updateChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    // Only creator or workspace admin can edit
    const wsm = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
    });
    if (!wsm || (channel.createdById !== userId && wsm.role !== "ADMIN")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name && { name: name.toLowerCase().replace(/[^a-z0-9-]/g, "-") }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({ channel: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/channels/:channelId
exports.deleteChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: "Channel not found" });
    if (channel.name === "general") return res.status(400).json({ error: "Cannot delete #general channel" });

    const wsm = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
    });
    if (!wsm || wsm.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can delete channels" });
    }

    await prisma.channel.delete({ where: { id: channelId } });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${channel.workspaceId}`).emit("channel:deleted", { channelId });
    }

    res.json({ message: "Channel deleted successfully" });
  } catch (err) {
    next(err);
  }
};
