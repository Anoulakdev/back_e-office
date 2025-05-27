const express = require("express");
const router = express.Router();

// controllers
const {
  listdocexternal,
  person,
  history,
  gethistory,
  gethistoryall,
  getdocumentall,
} = require("../controllers/external/docexlogController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docexlogs", auth, listdocexternal);
router.get("/docexlogs/getdocumentall", auth, getdocumentall);
router.get("/docexlogs/person", auth, person);
router.get("/docexlogs/history", auth, history);
router.get("/docexlogs/:docexId", auth, gethistory);
router.get("/docexlogs/historyall/:docexId", auth, gethistoryall);

module.exports = router;
