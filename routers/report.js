const express = require("express");
const router = express.Router();

// controllers
const { list, outdoc, indoc } = require("../controllers/reportController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/reports", auth, list);
router.get("/reports/outdoc", auth, outdoc);
router.get("/reports/indoc", auth, indoc);

module.exports = router;
