const express = require("express");
const router = express.Router();

// controllers
const {
  listdocdirector,
  person,
  history,
  gethistory,
  gethistoryall,
  getdocumentall,
} = require("../controllers/director/docdtlogController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docdtlogs", auth, listdocdirector);
router.get("/docdtlogs/getdocumentall", auth, getdocumentall);
router.get("/docdtlogs/person", auth, person);
router.get("/docdtlogs/history", auth, history);
router.get("/docdtlogs/:docdtId", auth, gethistory);
router.get("/docdtlogs/historyall/:docdtId", auth, gethistoryall);

module.exports = router;
