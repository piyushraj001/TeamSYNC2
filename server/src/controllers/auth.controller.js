const transporter = require("../services/email.service");

const crypto = require("crypto");
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken
} = require("../lib/auth");

const { validatePassword } = require("../lib/validationPassword");
const { prisma } = require("../lib/prisma");
const { saveResetToken } = require("../services/auth.service");



// REGISTER
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

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true
      }
    });
    // ALL generate token by giving the payload 
    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};


///LOGIN


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // verify exisitng user by checking hased password with the given password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // generate the token by giving the payload
    const payload = { userId: user.id, email: user.email };
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    });
  } catch (err) {
    next(err);
  }
};



// FORGOT PASSWORD


exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email required" })
    }

    const token = await saveResetToken(email.toLowerCase());

    if (!token) {
      return res.json({ message: "If email exists, reset link sent." })
    }
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email.toLowerCase(),
      subject: "Password Reset Request",
      text: `Click the link to reset your password:\n\n${resetLink}`
    });
    console.log(`Reset link sent to ${email.toLowerCase()}`);
    res.json({ message: "If email exists, reset Link sent." })

  } catch (error) {
    next(error);
  }
}

// RESET PASSWORD

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Hash the received token to match with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid reset token and check expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user: set new password and clear reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    // Generate new tokens for auto-login
    const payload = { userId: updatedUser.id, email: updatedUser.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      message: "Password reset successful",
      user: updatedUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};
