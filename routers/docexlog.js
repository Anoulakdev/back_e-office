const express = require("express");
const router = express.Router();

// controllers
const {
  listdocexternal,
  gethistory,
  person,
} = require("../controllers/external/docexlog");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexlogs", auth, listdocexternal);
router.get("/docexlogs/:docexId", auth, gethistory);
router.get("/docexlogs/person", auth, person);

module.exports = router;
