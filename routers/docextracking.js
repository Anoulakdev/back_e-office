const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  create,
  director,
} = require("../controllers/external/docextracking");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docextrackings", auth, list);
router.post("/docextrackings", auth, create);
// router.post("/docextrackings/director", auth, director);

module.exports = router;
