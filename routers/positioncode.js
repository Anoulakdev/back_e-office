const express = require("express");
const router = express.Router();

// controllers
const { list, getById } = require("../controllers/positioncodeController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/positioncodes", auth, list);

router.get("/positioncodes/:poscodeId", auth, getById);

module.exports = router;
