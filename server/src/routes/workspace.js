const { Router } = require("express");
const controller = require("../controllers/workspace.controller");
const { authenticate } = require("../middleware/auth");
const router = Router();

// Apply authenticate middleware to all workspace endpoints
router.use(authenticate);

router.post("/", controller.createWorkspace);
router.get("/", controller.getWorkspaces);
router.get("/:id", controller.getWorkspaceDetails);
router.get("/preview/:inviteCode", controller.previewWorkspace);
router.post("/join/:inviteCode", controller.joinWorkspace);

module.exports = router;
