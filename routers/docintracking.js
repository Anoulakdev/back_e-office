const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  director,
  assistantdirector,
  department,
  division,
  office,
  unit,
  staff,
  updateview,
} = require("../controllers/internal/docintrackingController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docintrackings", auth, list);
router.get("/docintrackings/:doctrackingId", auth, getById);
router.post("/docintrackings/director", auth, director);
router.post("/docintrackings/assistantdirector", auth, assistantdirector);
router.post("/docintrackings/department", auth, department);
router.post("/docintrackings/division", auth, division);
router.post("/docintrackings/office", auth, office);
router.post("/docintrackings/unit", auth, unit);
router.post("/docintrackings/staff", auth, staff);
router.put("/docintrackings/updateview", auth, updateview);

module.exports = router;
