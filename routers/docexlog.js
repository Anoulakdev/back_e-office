const express = require("express");
const router = express.Router();

// controllers
const {
  listdocexternal,
  gethistory,
} = require("../controllers/external/docexlog");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexlogs", auth, listdocexternal);
router.get("/docexlogs/:docexId", auth, gethistory);

module.exports = router;
