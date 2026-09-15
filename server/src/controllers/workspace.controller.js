const { prisma } = require("../lib/prisma");
const crypto = require("crypto");

// 1. CREATE WORKSPACE (Includes auto-generating invite link & default general channel in a transaction)
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ error: "Workspace name must be between 2 and 50 characters" });
    }

    // Generate a unique URL-safe invite code
    const inviteCode = crypto.randomBytes(4).toString("hex");

    // Perform database operations in a strict transaction
    const result = await prisma.$transaction(async (tx) => {
      // a. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          inviteCode,
          ownerId: userId,
        },
      });

      // b. Add creator as ADMIN member
      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
      });

      // c. Create default #general channel
      const defaultChannel = await tx.channel.create({
        data: {
          name: "general",
          description: "Default channel for workspace announcements",
          isPrivate: false,
          workspaceId: workspace.id,
        },
      });

      // d. Add creator to the default channel
      await tx.channelMember.create({
        data: {
          userId,
          channelId: defaultChannel.id,
        },
      });

      return { workspace, defaultChannel };
    });

    res.status(201).json({
      message: "Workspace created successfully",
      workspace: result.workspace,
      defaultChannel: result.defaultChannel,
    });
  } catch (error) {
    next(error);
  }
};

// 2. GET USER WORKSPACES (Fetch all workspaces the user is a member of)
exports.getWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true, channels: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ workspaces });
  } catch (error) {
    next(error);
  }
};

// 3. GET WORKSPACE DETAILS (Channels & Members list)
exports.getWorkspaceDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        channels: {
          orderBy: { createdAt: "asc" },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Verify requesting user is a member of the workspace
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this workspace" });
    }

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
};

// 4. PREVIEW WORKSPACE VIA INVITE CODE (Before joining)
exports.previewWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Invalid or expired invite link" });
    }

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
};

// 5. JOIN WORKSPACE (Join workspace and auto-join all public channels)
exports.joinWorkspace = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.userId;

    const workspace = await prisma.workspace.findUnique({
      where: { inviteCode },
      include: {
        channels: {
          where: { isPrivate: false },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Invalid or expired invite link" });
    }

    // Check if already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspace.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: "You are already a member of this workspace" });
    }

    // Join workspace and public channels in a transaction
    await prisma.$transaction(async (tx) => {
      // a. Join workspace
      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: "MEMBER",
        },
      });

      // b. Auto-join all public channels
      const channelMemberships = workspace.channels.map((channel) => ({
        userId,
        channelId: channel.id,
      }));

      if (channelMemberships.length > 0) {
        await tx.channelMember.createMany({
          data: channelMemberships,
          skipDuplicates: true,
        });
      }
    });

    res.json({
      message: "Joined workspace successfully",
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 6. LIST WORKSPACE MEMBERS (explicit endpoint)
exports.getWorkspaceMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify requesting user is a member
    const requester = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    if (!requester) return res.status(403).json({ error: "Not a member of this workspace" });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: { id: true, email: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // Fetch ownerId to surface in response
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    res.json({ members, ownerId: workspace?.ownerId });
  } catch (error) {
    next(error);
  }
};

// 7. LEAVE WORKSPACE
exports.leaveWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check membership
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    if (!member) return res.status(400).json({ error: "You are not a member" });

    // Block the workspace owner from leaving — they must transfer ownership first
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (workspace?.ownerId === userId) {
      return res.status(400).json({
        error: "You are the workspace owner. Transfer ownership to another admin before leaving.",
      });
    }

    // Block the last admin from leaving (even if not the owner)
    if (member.role === "ADMIN") {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId: id, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Promote another member to admin before leaving" });
      }
    }

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });

    res.json({ message: "Left workspace successfully" });
  } catch (error) {
    next(error);
  }
};

// 8. UPDATE WORKSPACE (Admin only)
exports.updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
    });

    res.json({ workspace });
  } catch (error) {
    next(error);
  }
};

// 9. REGENERATE INVITE LINK (Admin only)
exports.regenerateInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const crypto = require("crypto");

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: id } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");
    const workspace = await prisma.workspace.update({
      where: { id },
      data: { inviteCode },
    });

    res.json({ inviteCode: workspace.inviteCode });
  } catch (error) {
    next(error);
  }
};

// 10. REMOVE MEMBER (Admin only)
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.userId;

    if (userId === targetUserId) {
      return res.status(400).json({ error: "Use leave workspace instead" });
    }

    const [requester, workspace] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: id } },
      }),
      prisma.workspace.findUnique({ where: { id }, select: { ownerId: true } }),
    ]);

    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Nobody — not even another admin — can remove the workspace owner
    if (workspace?.ownerId === targetUserId) {
      return res.status(403).json({ error: "The workspace owner cannot be removed" });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId: id } },
    });
    if (!target) return res.status(404).json({ error: "Member not found" });

    // Admins can only be removed by the owner (owner is also an admin in the membership table)
    if (target.role === "ADMIN" && workspace?.ownerId !== userId) {
      return res.status(403).json({ error: "Only the workspace owner can remove other admins" });
    }

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId: id } },
    });

    // Force-disconnect the removed user's socket from this workspace
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${targetUserId}`).emit("workspace:kicked", { workspaceId: id });
    }

    res.json({ message: "Member removed" });
  } catch (error) {
    next(error);
  }
};

// 11. UPDATE MEMBER ROLE (Admin only)
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const [requester, workspace] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: id } },
      }),
      prisma.workspace.findUnique({ where: { id }, select: { ownerId: true } }),
    ]);

    if (!requester || requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // The workspace owner's role is fixed — cannot be demoted
    if (workspace?.ownerId === targetUserId && role === "MEMBER") {
      return res.status(403).json({ error: "The workspace owner cannot be demoted" });
    }

    const updated = await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId: id } },
      data: { role },
    });

    res.json({ membership: updated });
  } catch (error) {
    next(error);
  }
};

// 12. TRANSFER OWNERSHIP (Owner only)
exports.transferOwnership = async (req, res, next) => {
  try {
    const { id, userId: newOwnerId } = req.params;
    const userId = req.user.userId;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!workspace) return res.status(404).json({ error: "Workspace not found" });
    if (workspace.ownerId !== userId) {
      return res.status(403).json({ error: "Only the current owner can transfer ownership" });
    }
    if (userId === newOwnerId) {
      return res.status(400).json({ error: "You are already the owner" });
    }

    // Ensure new owner is a member
    const newOwnerMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: newOwnerId, workspaceId: id } },
    });
    if (!newOwnerMember) {
      return res.status(404).json({ error: "Target user is not a workspace member" });
    }

    // Atomically: promote new owner to ADMIN + update ownerId
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id },
        data: { ownerId: newOwnerId },
      }),
      prisma.workspaceMember.update({
        where: { userId_workspaceId: { userId: newOwnerId, workspaceId: id } },
        data: { role: "ADMIN" },
      }),
    ]);

    res.json({ message: "Ownership transferred successfully" });
  } catch (error) {
    next(error);
  }
};
