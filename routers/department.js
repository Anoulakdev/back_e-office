const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  listuser,
  getById,
} = require("../controllers/departmentController");
// middleware
const { auth } = require("../middleware/auth");

router.get("/departments", auth, list);
router.get("/departments/listuser", auth, listuser);
router.get("/departments/:departmentId", auth, getById);

module.exports = router;
