const express = require("express");
const router = express.Router();

// controllers
const {
  list,
  listuser,
  getById,
} = require("../controllers/departmentController");
// middleware
// const { auth } = require("../middleware/auth");

router.get("/departments", list);
router.get("/departments/listuser", listuser);
router.get("/departments/:departmentId", getById);

module.exports = router;
