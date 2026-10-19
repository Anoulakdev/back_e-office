const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  getById,
  create,
  update,
} = require("../controllers/employeeController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/employees", auth, list);
router.get("/employees/:emp_code", auth, getById);
router.post("/employees", auth, create);
router.put("/employees/:emp_code", auth, update);

module.exports = router;
