const { Router } = require("express");
const channel = require("../controllers/channel.controller");
const message = require("../controllers/message.controller");
const { authenticate } = require("../middleware/auth");

const router = Router();
router.use(authenticate);

// Channel routes (under workspace)
// These are mounted at /api/workspaces/:workspaceId/channels in index.js

// GET /api/workspaces/:workspaceId/channels
router.get("/workspaces/:workspaceId/channels", channel.getChannels);
// POST /api/workspaces/:workspaceId/channels
router.post("/workspaces/:workspaceId/channels", channel.createChannel);

// Channel-level routes
router.get("/channels/:channelId", channel.getChannelDetails);
router.post("/channels/:channelId/join", channel.joinChannel);
router.delete("/channels/:channelId/members/me", channel.leaveChannel);
router.post("/channels/:channelId/members", channel.inviteToChannel);
router.get("/channels/:channelId/members", channel.getChannelMembers);
router.patch("/channels/:channelId", channel.updateChannel);
router.delete("/channels/:channelId", channel.deleteChannel);

// Message routes
router.get("/channels/:channelId/messages", message.getChannelMessages);
router.patch("/messages/:messageId", message.editMessage);
router.delete("/messages/:messageId", message.deleteMessage);

module.exports = router;
