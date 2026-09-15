const { Router } = require("express");
const controller = require("../controllers/invite.controller");
const { authenticate } = require("../middleware/auth");
const router = Router();

// ── PUBLIC (token-based, no auth needed to preview) ───────────────────────────
// Unauthenticated users can validate an invite to see the workspace name before
// being redirected to login. The token survives the redirect via query param.
router.get("/:token", controller.validateInvite);

// ── PROTECTED (must be logged in) ─────────────────────────────────────────────
// Accept: adds the authenticated user as a member.
// If the user isn't logged in, the frontend sends them to /login?redirect=/invite/:token
// After auth, the client calls POST /api/invites/:token/accept automatically.
router.post("/:token/accept", authenticate, controller.acceptInvite);

// ── WORKSPACE-SCOPED INVITE MANAGEMENT (admin only, handled in workspace routes) ──
// These are registered under /api/workspaces/:id/invites by the workspace router.
// Exported here for clarity but mounted in index.js via workspace routes.

module.exports = router;
