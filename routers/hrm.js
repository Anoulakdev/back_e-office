const express = require("express");
const router = express.Router();

// controllers
const {
  department,
  division,
  office,
  unit,
  positiongroup,
  positioncode,
  position,
  employee,
} = require("../controllers/hrmController");
// middleware
const { auth } = require("../middleware/auth");

router.post("/syncdepartment", auth, department);
router.post("/syncdivision", auth, division);
router.post("/syncoffice", auth, office);
router.post("/syncunit", auth, unit);
router.post("/syncpositiongroup", auth, positiongroup);
router.post("/syncpositioncode", auth, positioncode);
router.post("/syncposition", auth, position);
router.post("/syncemployee", auth, employee);

module.exports = router;
