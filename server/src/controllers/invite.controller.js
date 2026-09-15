const crypto = require("crypto");
const { prisma } = require("../lib/prisma");
const transporter = require("../services/email.service");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Build the full shareable invite URL from a token.
 * Uses APP_URL env var — never hardcoded so it works in prod too.
 */
const buildInviteUrl = (token) => {
  const base = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";
  return `${base}/invite/${token}`;
};

/**
 * Validate an invite record against all possible failure states.
 * Returns { valid: true } or { valid: false, status, error }.
 */
const validateInvite = (invite) => {
  if (!invite) {
    return { valid: false, status: 404, error: "Invite not found" };
  }
  if (invite.revokedAt) {
    return { valid: false, status: 410, error: "This invite link has been revoked. Ask for a new one." };
  }
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return { valid: false, status: 410, error: "This invite has expired. Ask for a new one." };
  }
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return { valid: false, status: 410, error: "This invite link has reached its maximum uses." };
  }
  return { valid: true };
};

// ─── 1. GENERATE INVITE LINK ──────────────────────────────────────────────────

exports.createInvite = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.userId;
    const { maxUses, expiresInDays } = req.body;

    // Only admins can create invite links
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required to create invite links" });
    }

    // Build expiry date if provided
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // CRITICAL: token is persisted to DB BEFORE returning — this prevents the
    // "invite link 404s on use" bug where a token is returned but never saved.
    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        createdById: userId,
        type: "LINK",
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        expiresAt,
      },
      include: {
        workspace: { select: { name: true } },
      },
    });

    res.status(201).json({
      invite: {
        id: invite.id,
        token: invite.token,
        url: buildInviteUrl(invite.token),
        maxUses: invite.maxUses,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        workspaceName: invite.workspace.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 2. VALIDATE TOKEN (pre-accept preview) ────────────────────────────────────

exports.validateInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    const check = validateInvite(invite);
    if (!check.valid) {
      return res.status(check.status).json({ error: check.error });
    }

    // Return enough info for the "You're joining X workspace" confirmation screen
    res.json({
      workspace: invite.workspace,
      inviteType: invite.type,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
    });
  } catch (err) {
    next(err);
  }
};

// ─── 3. ACCEPT INVITE ─────────────────────────────────────────────────────────

exports.acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId = req.user.userId;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: {
          include: { channels: { where: { isPrivate: false } } },
        },
      },
    });

    const check = validateInvite(invite);
    if (!check.valid) {
      return res.status(check.status).json({ error: check.error });
    }

    // Already a member?
    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
    });
    if (existing) {
      return res.status(200).json({
        message: "You're already a member of this workspace",
        workspace: { id: invite.workspace.id, name: invite.workspace.name },
        alreadyMember: true,
      });
    }

    // Atomically: add member to workspace + auto-join public channels + increment useCount.
    // The useCount increment is a DB-level atomic increment (Prisma `increment`) to prevent
    // race conditions where two simultaneous accepts both succeed past maxUses.
    await prisma.$transaction(async (tx) => {
      // a. Join workspace
      await tx.workspaceMember.create({
        data: { userId, workspaceId: invite.workspaceId, role: "MEMBER" },
      });

      // b. Auto-join all public channels
      const channelMemberships = invite.workspace.channels.map((ch) => ({
        userId,
        channelId: ch.id,
      }));
      if (channelMemberships.length > 0) {
        await tx.channelMember.createMany({ data: channelMemberships, skipDuplicates: true });
      }

      // c. Atomic useCount increment — prevents race condition overshooting maxUses
      await tx.invite.update({
        where: { token },
        data: { useCount: { increment: 1 } },
      });
    });

    res.json({
      message: "Joined workspace successfully",
      workspace: { id: invite.workspace.id, name: invite.workspace.name },
    });
  } catch (err) {
    next(err);
  }
};

// ─── 4. REVOKE INVITE ─────────────────────────────────────────────────────────

exports.revokeInvite = async (req, res, next) => {
  try {
    const { id: workspaceId, inviteId } = req.params;
    const userId = req.user.userId;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const invite = await prisma.invite.findFirst({
      where: { id: inviteId, workspaceId },
    });
    if (!invite) return res.status(404).json({ error: "Invite not found" });
    if (invite.revokedAt) return res.status(400).json({ error: "Invite already revoked" });

    await prisma.invite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
    });

    res.json({ message: "Invite revoked" });
  } catch (err) {
    next(err);
  }
};

// ─── 5. LIST INVITES FOR A WORKSPACE ──────────────────────────────────────────

exports.listInvites = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.userId;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const invites = await prisma.invite.findMany({
      where: { workspaceId, revokedAt: null },
      include: {
        createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const withUrls = invites.map((inv) => ({
      ...inv,
      url: buildInviteUrl(inv.token),
      isExpired: inv.expiresAt ? new Date() > inv.expiresAt : false,
      isMaxed: inv.maxUses !== null && inv.useCount >= inv.maxUses,
    }));

    res.json({ invites: withUrls });
  } catch (err) {
    next(err);
  }
};

// ─── 6. SEND EMAIL INVITE ─────────────────────────────────────────────────────

exports.sendEmailInvite = async (req, res, next) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.userId;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email address required" });
    }

    const [member, workspace] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
      }),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
    ]);

    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (!workspace) return res.status(404).json({ error: "Workspace not found" });

    // Check if email is already a member
    const invitedUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (invitedUser) {
      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
      });
      if (alreadyMember) {
        return res.status(400).json({ error: "This person is already a member of the workspace" });
      }
    }

    // Create a single-use, email-specific invite (expires in 7 days)
    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        createdById: userId,
        type: "EMAIL",
        email: email.toLowerCase(),
        maxUses: 1,           // Email invites are single-use
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteUrl = buildInviteUrl(invite.token);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.toLowerCase(),
      subject: `You've been invited to join ${workspace.name} on TeamSYNC`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You're invited to join <strong>${workspace.name}</strong> on TeamSYNC</h2>
          <p>Click the button below to accept your invitation. This link expires in 7 days.</p>
          <a href="${inviteUrl}" style="
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          ">Accept Invitation</a>
          <p style="color: #6b7280; font-size: 13px;">
            If the button doesn't work, paste this URL into your browser:<br/>
            <a href="${inviteUrl}">${inviteUrl}</a>
          </p>
        </div>
      `,
    });

    res.json({ message: `Invite sent to ${email}` });
  } catch (err) {
    next(err);
  }
};
