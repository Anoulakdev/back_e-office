const express = require("express");
const router = express.Router();
// import Controllers
const { login, profile, changepassword, resetpassword } = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/login", authLimiter, login);

router.post("/changepassword", auth, authLimiter, changepassword);

router.get("/profile", auth, profile);

router.put("/resetpassword/:userId", auth, authLimiter, resetpassword);
// Export
module.exports = router;

