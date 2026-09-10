const express = require("express");
const router = express.Router();

// controllers
const { list } = require("../controllers/notiController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/noti", auth, list);

module.exports = router;