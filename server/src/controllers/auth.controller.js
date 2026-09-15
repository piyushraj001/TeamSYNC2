const transporter = require("../services/email.service");
const crypto = require("crypto");
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../lib/auth");

const { validatePassword } = require("../lib/validationPassword");
const { prisma } = require("../lib/prisma");
const {
  saveResetToken,
  createSession,
  findValidSession,
  touchSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  parseDeviceInfo,
} = require("../services/auth.service");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Extract request metadata for session tracking.
 */
const getSessionMeta = (req) => ({
  deviceInfo: parseDeviceInfo(req.headers["user-agent"]),
  ipAddress: (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim(),
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "All fields required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist the session immediately — token is useless if not stored
    await createSession({ userId: user.id, refreshToken, ...getSessionMeta(req) });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist session — this is what enables logout, logout-all, and session listing
    await createSession({ userId: user.id, refreshToken, ...getSessionMeta(req) });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── REFRESH ──────────────────────────────────────────────────────────────────

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // 1. Verify JWT signature / expiry
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // 2. Verify the token is in the DB (wasn't logged out)
    const session = await findValidSession(refreshToken);
    if (!session) {
      return res.status(401).json({ error: "Session revoked or expired, please log in again" });
    }

    // 3. Touch lastActiveAt so idle sessions can be cleaned up
    await touchSession(session.id);

    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = generateAccessToken(newPayload);

    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

// ─── LOGOUT (current session) ─────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    await revokeSession(refreshToken);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── LOGOUT ALL (all sessions for the user) ────────────────────────────────────

exports.logoutAll = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    await revokeAllSessions(req.user.userId);
    res.json({ message: "Logged out of all devices" });
  } catch (err) {
    next(err);
  }
};

// ─── GET SESSIONS ─────────────────────────────────────────────────────────────

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await listSessions(req.user.userId);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const token = await saveResetToken(email.toLowerCase());

    if (!token) {
      // Don't reveal if email exists
      return res.json({ message: "If that email exists, a reset link was sent." });
    }

    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.toLowerCase(),
      subject: "Password Reset Request",
      text: `Click the link to reset your password:\n\n${resetLink}`,
    });

    res.json({ message: "If that email exists, a reset link was sent." });
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await hashPassword(newPassword);

    // Generate new tokens for auto-login BEFORE invalidating other sessions
    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Create the new session first so we have its id
    const newSession = await createSession({ userId: user.id, refreshToken, ...getSessionMeta(req) });

    // Update password, clear reset token, revoke ALL other sessions (security requirement)
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetTokenExpiry: null },
      }),
      // Revoke all sessions EXCEPT the new one just created
      revokeAllSessions(user.id, newSession.id),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, displayName: true, avatarUrl: true },
    });

    res.json({
      message: "Password reset successful. All other sessions have been signed out.",
      user: updatedUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
