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
} = require("../controllers/director/docdttrackingController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/docdttrackings", auth, list);
router.get("/docdttrackings/:doctrackingId", auth, getById);
router.post("/docdttrackings/director", auth, director);
router.post("/docdttrackings/assistantdirector", auth, assistantdirector);
router.post("/docdttrackings/department", auth, department);
router.post("/docdttrackings/division", auth, division);
router.post("/docdttrackings/office", auth, office);
router.post("/docdttrackings/unit", auth, unit);
router.post("/docdttrackings/staff", auth, staff);
router.put("/docdttrackings/updateview", auth, updateview);

module.exports = router;
