// ******* - ONLY ROUTES SHOULD BE IN THIS FOLDER NOT TOO MUCH LOGIC 
// THIS FOLDER IS NOT FOR THE 
//          DB CALL 
//          TOKEN LOGIC
//          VALIDATON CHECK - ********* //

// ******------- URL ---> CONTROLLERS  --------*********

const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { authRateLimit } = require("../middleware/rateLimiter");
const router = Router();

router.post("/register", controller.register);
router.post("/login", authRateLimit, controller.login);
router.post("/forgot-password", authRateLimit, controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = router;