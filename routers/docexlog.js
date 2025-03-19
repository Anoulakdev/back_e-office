const express = require("express");
const router = express.Router();

// controllers
const {
  listdocexternal,
  person,
  gethistory,
} = require("../controllers/external/docexlog");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexlogs", auth, listdocexternal);
router.get("/docexlogs/person", auth, person);
router.get("/docexlogs/:docexId", auth, gethistory);

module.exports = router;
