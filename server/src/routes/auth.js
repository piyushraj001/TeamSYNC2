const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { authRateLimit } = require("../middleware/rateLimiter");
const { authenticate } = require("../middleware/auth");
const router = Router();

// Public routes
router.post("/register", controller.register);
router.post("/login", authRateLimit, controller.login);
router.post("/refresh", controller.refresh);              // Stateless JWT check + DB session validation
router.post("/logout", controller.logout);                // Revokes current session by refresh token
router.post("/forgot-password", authRateLimit, controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// Protected routes (require valid access token)
router.get("/me", authenticate, controller.getCurrentUser);
router.post("/logout-all", authenticate, controller.logoutAll);    // Revokes ALL sessions for user
router.get("/sessions", authenticate, controller.getSessions);      // List active sessions

module.exports = router;