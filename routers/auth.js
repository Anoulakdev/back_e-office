const express = require("express");
const router = express.Router();
// import Controllers
const { login, profile, changepassword, resetpassword } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

router.post("/login", login);

router.post("/changepassword", auth, changepassword);

router.get("/profile", auth, profile);

router.put("/resetpassword/:userId", auth, resetpassword);
// Export
module.exports = router;
