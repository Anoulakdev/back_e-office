const express = require("express");
const router = express.Router();

// controllers
const {
  listdocinternal,
  person,
  history,
  gethistory,
  gethistoryall,
} = require("../controllers/internal/docinlogController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docinlogs", auth, listdocinternal);
router.get("/docinlogs/person", auth, person);
router.get("/docinlogs/history", auth, history);
router.get("/docinlogs/:docinId", auth, gethistory);
router.get("/docinlogs/historyall/:docinId", auth, gethistoryall);

module.exports = router;
