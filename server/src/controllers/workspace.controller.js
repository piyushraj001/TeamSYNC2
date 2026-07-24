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

    // Generate a unique URL-safe 8-character invite code
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
