const { Router } = require("express");
const dm = require("../controllers/dm.controller");
const { authenticate } = require("../middleware/auth");

const router = Router();
router.use(authenticate);

router.get("/", dm.getDMConversations);
router.get("/:recipientId", dm.getOrCreateDMConversation);
router.get("/:conversationId/messages", dm.getDMMessages);

module.exports = router;
