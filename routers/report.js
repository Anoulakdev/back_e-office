const express = require("express");
const router = express.Router();

// controllers
const { list, out } = require("../controllers/reportController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/reports", auth, list);
router.get("/reports/out", auth, out);

module.exports = router;
