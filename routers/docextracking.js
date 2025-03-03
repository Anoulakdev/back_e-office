const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  director,
} = require("../controllers/external/docextracking");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docextrackings", auth, list);
router.get("/docextrackings/:doctrackingId", auth, getById);
router.post("/docextrackings", auth, create);
// router.post("/docextrackings/director", auth, director);

module.exports = router;
