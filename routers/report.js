const express = require("express");
const router = express.Router();

// controllers
const { list } = require("../controllers/reportController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/reports", auth, list);

module.exports = router;
