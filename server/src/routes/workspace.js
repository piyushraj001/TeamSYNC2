const { Router } = require("express");
const controller = require("../controllers/workspace.controller");
const inviteController = require("../controllers/invite.controller");
const { authenticate } = require("../middleware/auth");
const router = Router();

// All workspace endpoints require authentication
router.use(authenticate);

router.post("/", controller.createWorkspace);
router.get("/", controller.getWorkspaces);

// Preview & join (no workspace membership check — user hasn't joined yet)
router.get("/preview/:inviteCode", controller.previewWorkspace);
router.post("/join/:inviteCode", controller.joinWorkspace);

// Workspace-scoped routes
router.get("/:id", controller.getWorkspaceDetails);
router.patch("/:id", controller.updateWorkspace);

// Members
router.get("/:id/members", controller.getWorkspaceMembers);
router.delete("/:id/members/me", controller.leaveWorkspace);
router.delete("/:id/members/:userId", controller.removeMember);
router.patch("/:id/members/:userId/role", controller.updateMemberRole);
router.post("/:id/members/:userId/transfer-ownership", controller.transferOwnership);

// Invite link (legacy simple code — kept for backward compat)
router.post("/:id/regenerate-invite", controller.regenerateInvite);

// Invite system (full-featured: expiry, max-uses, revoke, email)
// IMPORTANT: email route must come before :inviteId route to avoid Express collision
router.post("/:id/invites/email", inviteController.sendEmailInvite);        // Send email invite
router.post("/:id/invites", inviteController.createInvite);                 // Generate invite link
router.get("/:id/invites", inviteController.listInvites);                   // List active invites
router.delete("/:id/invites/:inviteId", inviteController.revokeInvite);     // Revoke an invite

module.exports = router;
