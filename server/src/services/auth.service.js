const crypto = require("crypto");
const { prisma } = require("../lib/prisma");

// ─── RESET TOKEN ──────────────────────────────────────────────────────────────

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hashedToken };
};

const saveResetToken = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const { token, hashedToken } = generateResetToken();

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });

  return token;
};

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────────

/**
 * Hash a refresh token for safe DB storage.
 * We store the hash so stolen DB doesn't expose real tokens.
 */
const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Create a new session record in the DB and return its id.
 * Must be called AFTER generating the refresh token so the hash can be stored.
 */
const createSession = async ({ userId, refreshToken, deviceInfo, ipAddress }) => {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  // Refresh tokens are long-lived: 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      deviceInfo: deviceInfo || "Unknown device",
      ipAddress: ipAddress || null,
      expiresAt,
    },
  });

  return session;
};

/**
 * Find a session by refresh token hash and check it isn't expired.
 */
const findValidSession = async (refreshToken) => {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const session = await prisma.session.findUnique({ where: { refreshTokenHash } });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session;
};

/**
 * Touch lastActiveAt for a session (call on successful refresh).
 */
const touchSession = async (sessionId) => {
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
};

/**
 * Revoke a single session by its refresh token.
 */
const revokeSession = async (refreshToken) => {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  await prisma.session.deleteMany({ where: { refreshTokenHash } });
};

/**
 * Revoke ALL sessions for a user, optionally excluding one session id
 * (used during password reset — keep the session doing the reset).
 */
const revokeAllSessions = async (userId, exceptSessionId = null) => {
  await prisma.session.deleteMany({
    where: {
      userId,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
  });
};

/**
 * List all active (non-expired) sessions for a user.
 */
const listSessions = async (userId) => {
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true,
      lastActiveAt: true,
      expiresAt: true,
    },
  });
};

/**
 * Parse a User-Agent string into a human-readable device label.
 */
const parseDeviceInfo = (userAgent = "") => {
  if (!userAgent) return "Unknown device";

  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
};

module.exports = {
  saveResetToken,
  hashRefreshToken,
  createSession,
  findValidSession,
  touchSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  parseDeviceInfo,
};
