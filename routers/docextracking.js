const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  director,
  assistantdirector,
  department,
  division,
  office,
  unit,
  staff,
} = require("../controllers/external/docextrackingController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docextrackings", auth, list);
router.get("/docextrackings/:doctrackingId", auth, getById);
router.post("/docextrackings", auth, create);
router.post("/docextrackings/director", auth, director);
router.post("/docextrackings/assistantdirector", auth, assistantdirector);
router.post("/docextrackings/department", auth, department);
router.post("/docextrackings/division", auth, division);
router.post("/docextrackings/office", auth, office);
router.post("/docextrackings/unit", auth, unit);
router.post("/docextrackings/staff", auth, staff);

module.exports = router;
